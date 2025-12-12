from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view
from django.db.models import Max
from django.core.files.storage import default_storage
from django.conf import settings
import os
import uuid


from .models import (
    Team, TeamMember, Project, Column, Task, Subtask, Attachment, Comment, ChatMessage, DirectMessage,
    PushToken, Notification
)
from .serializers import (
    UserSerializer, RegisterSerializer, TeamSerializer, NestedUserSerializer, ProjectSerializer,
    ColumnSerializer, TaskSerializer, SubtaskSerializer, AttachmentSerializer,
    CommentSerializer, ChatMessageSerializer, DirectMessageSerializer,
    PushTokenSerializer, NotificationSerializer
)
from .permissions import IsTeamAdmin
from rest_framework.permissions import IsAuthenticated

User = get_user_model()

from . import notifications as notifier


def _delete_storage_file_by_url(url):
    """Delete a stored file referenced by a full/absolute URL.

    Tries to convert the public URL into a storage-relative path and delete it
    via Django's `default_storage`. This is best-effort and will swallow
    exceptions so DB cleanup can continue even if file removal fails.
    """
    try:
        if not url:
            return
        media_url = settings.MEDIA_URL or ""
        path = None
        # If MEDIA_URL is contained in the url, strip everything up to and including MEDIA_URL
        if media_url and media_url in url:
            idx = url.find(media_url) + len(media_url)
            path = url[idx:]
        else:
            # Fallback: try to parse the path component and strip a leading slash
            try:
                from urllib.parse import urlparse
                parsed = urlparse(url)
                path = parsed.path or ""
                if media_url and media_url in path:
                    idx = path.find(media_url) + len(media_url)
                    path = path[idx:]
            except Exception:
                path = url
        if not path:
            return
        # normalize: remove leading slash and URL-decode to handle %20 / encoded chars
        try:
            from urllib.parse import unquote
            path = unquote(path.lstrip('/'))
        except Exception:
            path = path.lstrip('/')

        # delete if exists
        try:
            if default_storage.exists(path):
                default_storage.delete(path)
        except Exception:
            # swallow storage/backend-specific errors
            pass
    except Exception:
        # ensure this helper never raises
        return
    
    
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        return Response(self.get_serializer(request.user).data)
    
    @action(detail=False, methods=['post'], permission_classes=[])
    def register(self, request):
        """
        POST /api/users/register/
        Body: { "name": "John", "email": "john@example.com", "password": "pass123" }
        """
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Return user in the same format as your frontend expects
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"], url_path="invite", permission_classes=[IsAuthenticated, IsTeamAdmin])
    def invite(self, request, pk=None):
        team = self.get_object()
        email = request.data.get("email")
        if not email:
            return Response({"error": "email required"}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "user not found"}, status=404)
        TeamMember.objects.get_or_create(team=team, user=user, defaults={"role": "member"})
        return Response(TeamSerializer(team).data)

    @action(detail=True, methods=["post"], url_path="join", permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        team = self.get_object()
        uid = str(request.user.id)
        if uid not in team.join_requests:
            team.join_requests.append(uid)
            team.save()
            # Notify team admins about join request
            try:
                admins = [m.user for m in team.team_members.filter(role='admin')]
                for admin in admins:
                    notifier.enqueue_notification(
                        user=admin,
                        actor=request.user,
                        verb='join_request',
                        data={'teamId': str(team.id), 'teamName': team.name},
                        channels=['push', 'email']
                    )
            except Exception:
                pass
        return Response({"message": "join request submitted", "name": team.name})

    @action(detail=True, methods=["post"], url_path=r"requests/(?P<user_id>[^/.]+)", permission_classes=[IsAuthenticated, IsTeamAdmin])
    def manage_request(self, request, pk=None, user_id=None):
        team = self.get_object()
        action = request.data.get("action")
        if action not in ("approve", "deny"):
            return Response({"error": "invalid action"}, status=400)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "user not found"}, status=404)

        if action == "approve":
            TeamMember.objects.get_or_create(team=team, user=user, defaults={"role": "member"})
            if user_id in team.join_requests:
                team.join_requests.remove(user_id)
                team.save()
            # Notify the approved user
            try:
                notifier.enqueue_notification(
                    user=user,
                    actor=request.user,
                    verb='join_approved',
                    data={'teamId': str(team.id)},
                    channels=['push', 'email', 'sms'] if user.phone else ['push', 'email']
                )
            except Exception:
                pass
            return Response({"message": "approved", "team": TeamSerializer(team).data})
        else:
            if user_id in team.join_requests:
                team.join_requests.remove(user_id)
                team.save()
            # Notify the denied user
            try:
                notifier.enqueue_notification(
                    user=user,
                    actor=request.user,
                    verb='join_denied',
                    data={'teamId': str(team.id)},
                    channels=['push', 'email', 'sms'] if user.phone else ['push', 'email']
                )
            except Exception:
                pass
            return Response({"message": "denied", "team": TeamSerializer(team).data})


DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"]

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        todo = Column.objects.create(project=project, title="To Do", order=0)
        inprog = Column.objects.create(project=project, title="In Progress", order=1)
        done = Column.objects.create(project=project, title="Done", order=2)

        # Create default columns
        column_objects = [todo, inprog, done]

        # Update columnOrder on the project
        project.column_order = [str(col.id) for col in column_objects]
        project.save()

        # Add project ID to the team's project_ids
        team = project.team
        team.project_ids.append(str(project.id))  # Add new project ID
        team.save()

        # Serialize the project with nested columns
        project_data = ProjectSerializer(project).data

        # Serialize the team
        team_data = TeamSerializer(project.team).data

        # Notify team members about new project
        try:
            for member in project.team.team_members.all():
                notifier.enqueue_notification(
                    user=member.user,
                    actor=request.user,
                    verb='created_project',
                    data={'projectId': str(project.id), 'projectName': project.name, 'teamId': str(project.team.id), 'teamName': project.team.name},
                    channels=['push', 'email']
                )
        except Exception:
            pass

        return Response(
            {"newProject": project_data, "updatedTeam": team_data},
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def chatmessages(self, request, pk=None):
        project_id = self.get_object().id
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        content = request.data.get("content")
        if not content:
            return Response({"error": "Message content required"}, status=status.HTTP_400_BAD_REQUEST)

        message = ChatMessage.objects.create(
            project=project,
            author=request.user,
            content=content
        )

        # Return the saved message
        return Response({
            "id": str(message.id),
            "projectId": str(project.id),
            "author": {"id": message.author.id, "name": message.author.name, "avatarUrl": str(message.author.avatar)},
            "content": message.content,
            "timestamp": message.timestamp
        }, status=status.HTTP_201_CREATED)


class ColumnViewSet(viewsets.ModelViewSet):
    queryset = Column.objects.all()
    serializer_class = ColumnSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """Create a new column for a project"""
        try:
            project = Project.objects.get(id=request.data.get('projectId'))
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        
        title = request.data.get('title')
        if not title:
            return Response({"error": "Title is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Determine order
        max_order = project.columns.aggregate(Max('order'))['order__max'] or -1
        new_column = Column.objects.create(project=project, title=title, order=max_order + 1)

        column_order = [str(col.id) for col in project.columns.all().order_by('order')]
        columns_data = { str(col.id): self.get_serializer(col).data for col in project.columns.all() }

        return Response({
            "columns": columns_data,
            "columnOrder": column_order
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        Update the title of a column.
        Expects JSON: { "newTitle": "name" }
        """
        try:
            column = self.get_object()  # retrieves Column by pk
        except Column.DoesNotExist:
            return Response({"error": "Column not found"}, status=status.HTTP_404_NOT_FOUND)
        
        new_name = request.data.get("newTitle")
        if not new_name:
            return Response({"error": "newTitle is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        column.title = new_name
        column.save()

        return Response(self.get_serializer(column).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["put"], url_path="move")
    def move(self, request):
        project_id = request.data["projectId"]

        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        col_ids = request.data["newOrder"]

        for index, col_id in enumerate(col_ids):
            try:
                column = Column.objects.get(id=col_id, project=project)
                column.order = index
                column.save()
            except Column.DoesNotExist:
                continue

        # Return updated column order
        column_order = [str(col.id) for col in Column.objects.filter(project=project).order_by('order')]

        return Response(column_order, status=status.HTTP_200_OK)
    

    def destroy(self, request, pk=None):
        """Delete a column, move its tasks to the first column, and update ordering."""
        try:
            column = Column.objects.get(id=pk)
        except Column.DoesNotExist:
            return Response({"error": "Column not found"}, status=status.HTTP_404_NOT_FOUND)

        project = column.project

        # Get all columns ordered
        columns = list(project.columns.all().order_by("order"))

        # Ensure there is another column to move tasks into
        if len(columns) <= 1:
            return Response({"error": "Cannot delete the only column in a project."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Determine target column (first column in order)
        first_column = columns[0] if columns[0].id != column.id else columns[1]

        # Move tasks from deleted column → first column
        tasks_to_move = column.task_ids

        for task in tasks_to_move:
            first_column.task_ids.append(task)

        first_column.save()

        # Delete the column
        column.delete()

        # Re-order remaining columns (0,1,2,...)
        remaining_columns = project.columns.all().order_by("order")
        for i, col in enumerate(remaining_columns):
            col.order = i
            col.save()

        # Update project.columnOrder
        column_order = [str(col.id) for col in remaining_columns]
        project.columnOrder = column_order
        project.save()

        return Response(status=status.HTTP_204_NO_CONTENT)




class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().select_related("project")
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    # Override create to ensure task is linked to project and placed into column
    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            column_id = request.data.get("columnId")  # column to insert into
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            task = serializer.save()
            # if column_id provided, append to column.task_ids
            if column_id:
                col = get_object_or_404(Column, id=column_id, project=task.project)
                col.task_ids.append(str(task.id))
                col.save()
            # Notify assignees of new task assignment
            try:
                for assignee in task.assignees.all():
                    notifier.enqueue_notification(
                        user=assignee,
                        actor=request.user,
                        verb='task_assigned',
                        data={'taskId': str(task.id), 'taskTitle': task.title, 'projectId': str(task.project.id), 'projectName': task.project.name},
                        channels=['push', 'email']
                    )
            except Exception:
                pass
            return Response(self.get_serializer(task).data, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=["put"], url_path="move")
    def move(self, request, pk=None):
        task = self.get_object()
        to_column_id = request.data.get("toColumnId")
        position = request.data.get("position", None)

        if not to_column_id:
            return Response({"error": "toColumnId required"}, status=400)

        to_column = get_object_or_404(Column, id=to_column_id)

        if to_column.project_id != task.project_id:
            return Response({"error": "column and task project mismatch"}, status=400)

        with transaction.atomic():
            # Get original column and index
            original_column = next((col for col in Column.objects.filter(project=task.project)
                                    if str(task.id) in col.task_ids), None)
            original_index = None
            if original_column:
                original_index = original_column.task_ids.index(str(task.id))

            task_id_str = str(task.id)

            # Remove from all columns
            all_columns = Column.objects.filter(project=task.project)
            
            # Remove from all columns
            for col in all_columns:
                # remove duplicates first
                col.task_ids = list(dict.fromkeys(col.task_ids))
                # remove the task if present
                if task_id_str in col.task_ids:
                    col.task_ids.remove(task_id_str)
                    col.save()  # save immediately

            # Reload the target column to be safe
            to_column = Column.objects.get(id=to_column_id)
            to_column.task_ids = list(dict.fromkeys(to_column.task_ids))  # ensure unique

            # Insert at position
            if position is None or position >= len(to_column.task_ids) or position < 0:
                to_column.task_ids.append(task_id_str)
            else:
                to_column.task_ids.insert(position, task_id_str)

            to_column.task_ids = list(dict.fromkeys(to_column.task_ids))  # final uniqueness
            to_column.save()


            # Build response object
            columns_object = {
                str(col.id): ColumnSerializer(col).data
                for col in Column.objects.filter(project=task.project)
            }

            return Response({"columns": columns_object}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="comments")
    def comments(self, request, pk=None):
        """POST /tasks/{id}/comments/ - add a comment to a task (author = request.user)
        Body: { "content": "..." }
        """
        task = self.get_object()
        content = request.data.get("content")
        if not content:
            return Response({"error": "content required"}, status=400)

        comment = Comment.objects.create(author=request.user, content=content)
        task.comments.add(comment)

        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="attachments")
    def attachments(self, request, pk=None):
        """POST /tasks/{id}/attachments/ - upload one or more files and attach to task
        Expects multipart/form-data with `files` (one or many).
        Returns created Attachment objects.
        """
        task = self.get_object()

        # Accept multiple files under 'files' or single 'file'
        files = []
        try:
            files = request.FILES.getlist('files')
        except Exception:
            files = []
        if not files:
            # try single file key
            single = request.FILES.get('file')
            if single:
                files = [single]

        if not files:
            return Response({"error": "no files provided"}, status=400)

        created = []
        for f in files:
            # save to default storage under attachments/
            unique_name = f"{uuid.uuid4().hex}_{f.name}"
            rel_path = os.path.join('attachments', unique_name)
            saved_path = default_storage.save(rel_path, f)

            # build an absolute URL to the saved file
            try:
                file_url = default_storage.url(saved_path)
                if not file_url.startswith('http'):
                    file_url = request.build_absolute_uri(file_url)
            except Exception:
                file_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)

            att = Attachment.objects.create(name=f.name, url=file_url)
            task.attachments.add(att)
            created.append(att)

        return Response(AttachmentSerializer(created, many=True).data, status=status.HTTP_201_CREATED)

    # override destroy to remove references in columns and delete task safely
    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        project = task.project
        with transaction.atomic():
            # remove task id from any column in project
            cols = Column.objects.filter(project=project)
            for c in cols:
                if str(task.id) in c.task_ids:
                    c.task_ids = [tid for tid in c.task_ids if tid != str(task.id)]
                    c.save()

            # Delete attachments' stored files and attachment objects attached to this task
            try:
                attachments = list(task.attachments.all())
                for att in attachments:
                    try:
                        _delete_storage_file_by_url(att.url)
                    except Exception:
                        pass
                    try:
                        att.delete()
                    except Exception:
                        pass
            except Exception:
                # ensure we do not abort deletion if something goes wrong
                pass

            # Delete comment objects attached to this task
            try:
                comments = list(task.comments.all())
                for cm in comments:
                    try:
                        cm.delete()
                    except Exception:
                        pass
            except Exception:
                pass

            # finally delete the task itself
            task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class SubtaskViewSet(viewsets.ModelViewSet):
    serializer_class = SubtaskSerializer
    queryset = Subtask.objects.all()
    permission_classes = [IsAuthenticated]

    def get_task(self):
        # assumes nested URL: /tasks/<task_id>/subtasks/
        task_id = self.kwargs.get("task_pk")  # DRF nested routers use <lookup>_field
        return get_object_or_404(Task, id=task_id)
    
    def perform_create(self, serializer):
        task = self.get_task()
        serializer.save(task=task)


class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        att = self.get_object()
        # attempt to remove stored file before deleting the DB record
        try:
            _delete_storage_file_by_url(att.url)
        except Exception:
            pass
        att.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]


class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]


class DirectMessageViewSet(viewsets.ModelViewSet):
    queryset = DirectMessage.objects.all()
    serializer_class = DirectMessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class PushTokenViewSet(viewsets.ModelViewSet):
    queryset = PushToken.objects.all()
    serializer_class = PushTokenSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Create or update a push token for the current user
        token = request.data.get('token')
        platform = request.data.get('platform')
        if not token:
            return Response({'error': 'token required'}, status=400)
        obj, created = PushToken.objects.get_or_create(token=token, defaults={'user': request.user, 'platform': platform})
        if not created:
            # ensure the token belongs to this user
            obj.user = request.user
            obj.platform = platform
            obj.save()
        return Response(PushTokenSerializer(obj).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='unregister')
    def unregister(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'token required'}, status=400)
        try:
            PushToken.objects.filter(token=token, user=request.user).delete()
        except Exception:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # return notifications for the current user by default
        qs = Notification.objects.filter(user=self.request.user)
        return qs

    def partial_update(self, request, *args, **kwargs):
        # allow marking as read via PATCH { read: true }
        return super().partial_update(request, *args, **kwargs)


# Bundled data endpoint
from rest_framework.views import APIView

class AllDataView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        users = UserSerializer(User.objects.all(), many=True).data
        teams = TeamSerializer(Team.objects.all(), many=True).data
        projects = ProjectSerializer(Project.objects.all(), many=True).data
        direct_messages = DirectMessageSerializer(DirectMessage.objects.all(), many=True).data
        notifications = NotificationSerializer(Notification.objects.all(), many=True).data

        # format like your frontend expects
        return Response({
            "users": {u["id"]: u for u in users},
            "teams": {t["id"]: t for t in teams},
            "projects": {p["id"]: p for p in projects},
            "directMessages": {dm["id"]: dm for dm in direct_messages},
            "notifications": {n["id"]: n for n in notifications}
        })
