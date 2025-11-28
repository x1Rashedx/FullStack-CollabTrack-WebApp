from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from .models import (
    Attachment, Comment, Task, Column, ChatMessage,
    TeamMember, Team, Project, DirectMessage
)
from .utils import compress_base64_image, rename_file

User = get_user_model()

class NestedUserSerializer(serializers.ModelSerializer):
    """Lean user serializer for nested user data (assignees, authors, etc.)"""
    id = serializers.UUIDField(read_only=True)
    avatarUrl = serializers.ImageField(source='avatar', use_url=False, read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "avatarUrl"]


class UserSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    avatarUrl = serializers.ImageField(source='avatar', use_url=False, read_only=True)
    avatar = serializers.ImageField(use_url=False, required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "avatarUrl", "email", "phone", "gender", "avatar"]

    def update(self, instance, validated_data):
        # Handle avatar updates
        avatar = validated_data.get("avatar")

        # If an avatar is being provided (or explicitly set to null/None),
        # remove any existing avatar file from storage to avoid orphaned files.
        if "avatar" in validated_data:
            try:
                if instance.avatar and getattr(instance.avatar, 'name', None):
                    old_name = instance.avatar.name
                    if old_name:
                        try:
                            if default_storage.exists(old_name):
                                default_storage.delete(old_name)
                        except Exception:
                            pass
            except Exception:
                pass

        if avatar:
            # If it's a string (legacy base64), convert it
            if isinstance(avatar, str) and avatar.startswith("data:image"):
                compressed = compress_base64_image(avatar)
                validated_data["avatar"] = compressed
            else:
                # Uploaded File → rename before saving
                validated_data["avatar"] = rename_file(avatar)
            # Otherwise it's already a File object from form upload

        return super().update(instance, validated_data)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "name", "email", "password"]

    def create(self, validated_data):
        # Use custom manager to create user with hashed password
        user = User.objects.create_user(
            email=validated_data["email"],
            name=validated_data["name"],
            password=validated_data["password"]
        )
        return user

class AttachmentSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    class Meta:
        model = Attachment
        fields = ["id", "name", "url", "createdAt"]


class CommentSerializer(serializers.ModelSerializer):
    author = NestedUserSerializer(read_only=True)
    timestamp = serializers.DateTimeField(read_only=True)
    author_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source="author", required=False)

    class Meta:
        model = Comment
        fields = ["id", "author", "author_id", "content", "timestamp"]


class TaskSerializer(serializers.ModelSerializer):
    assignees = NestedUserSerializer(many=True, read_only=True)
    assigneeIds = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, write_only=True, source="assignees", required=False)

    attachments = AttachmentSerializer(many=True, read_only=True)
    attachmentIds = serializers.PrimaryKeyRelatedField(queryset=Attachment.objects.all(), many=True, write_only=True, source="attachments", required=False)

    comments = serializers.SerializerMethodField()
    commentIds = serializers.PrimaryKeyRelatedField(queryset=Comment.objects.all(), many=True, write_only=True, source="comments", required=False)

    dueDate = serializers.DateTimeField(source="due_date", allow_null=True, required=False)

    weight = serializers.IntegerField(required=False, default=1)
    completed = serializers.BooleanField(required=False, default=False)

    projectId = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all(), source="project", write_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "assignees", "assigneeIds",
            "dueDate", "priority", "tags", "attachments", "attachmentIds",
            "comments", "commentIds", "projectId", "weight", "completed",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        assignees = validated_data.pop("assignees", [])
        attachments = validated_data.pop("attachments", [])
        comments = validated_data.pop("comments", [])
        task = Task.objects.create(**validated_data)
        if assignees:
            task.assignees.set(assignees)
        if attachments:
            task.attachments.set(attachments)
        if comments:
            task.comments.set(comments)
        return task

    def update(self, instance, validated_data):
        assignees = validated_data.pop("assignees", None)
        attachments = validated_data.pop("attachments", None)
        comments = validated_data.pop("comments", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if assignees is not None:
            instance.assignees.set(assignees)
        if attachments is not None:
            instance.attachments.set(attachments)
        if comments is not None:
            instance.comments.set(comments)
        return instance
    
    def get_comments(self, obj):
        return [CommentSerializer(c).data for c in obj.comments.all().order_by('timestamp')]


class ColumnSerializer(serializers.ModelSerializer):
    taskIds = serializers.SerializerMethodField()

    class Meta:
        model = Column
        fields = ["id", "title", "taskIds", "project"]

    def get_taskIds(self, obj):
        return obj.task_ids
        


class ChatMessageSerializer(serializers.ModelSerializer):
    author = NestedUserSerializer(read_only=True)
    timestamp = serializers.DateTimeField(read_only=True)
    class Meta:
        model = ChatMessage
        fields = ["id", "author", "content", "timestamp"]


class TeamMemberSerializer(serializers.ModelSerializer):
    user = NestedUserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source="user")
    class Meta:
        model = TeamMember
        fields = ["id", "user", "user_id", "role"]


class TeamSerializer(serializers.ModelSerializer):
    members = TeamMemberSerializer(many=True, read_only=True, source="team_members")
    joinRequests = serializers.ListField(source="join_requests", required=False)  # camelCase
    projectIds = serializers.ListField(source="project_ids", read_only=True)       # camelCase

    class Meta:
        model = Team
        fields = ["id", "name", "description", "icon", "members", "projectIds", "joinRequests"]

    def create(self, validated_data):
        user = self.context['request'].user
        team = Team.objects.create(**validated_data)
        TeamMember.objects.create(user=user, team=team, role="admin")
        return team

class ProjectSerializer(serializers.ModelSerializer):
    tasks = serializers.SerializerMethodField()
    columns = serializers.SerializerMethodField()
    columnOrder = serializers.SerializerMethodField() # Computed field
    chatMessages = serializers.SerializerMethodField() # Computed field

    team = serializers.PrimaryKeyRelatedField(queryset=Team.objects.all(), write_only=True)
    teamId = serializers.UUIDField(source="team.id", read_only=True)

    class Meta:
        model = Project
        fields = ["id", "name", "description", "team", "teamId", "tasks", "columns", "columnOrder", "chatMessages"]

    def get_tasks(self, obj):
        # return a dict keyed by task ID
        return { str(task.id): TaskSerializer(task).data for task in obj.tasks.all() }

    def get_columns(self, obj):
        return {
            str(col.id): ColumnSerializer(col).data
            for col in obj.columns.all()
        }

    def get_columnOrder(self, obj):
        return [str(col.id) for col in obj.columns.order_by("order")]
    
    def get_chatMessages(self, obj):
        return [ChatMessageSerializer(msg).data for msg in obj.chat_messages.all().order_by('timestamp')]


class DirectMessageSerializer(serializers.ModelSerializer):
    senderId = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source="sender", required=False)
    receiverId = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source="receiver")

    class Meta:
        model = DirectMessage
        fields = ["id", "senderId", "receiverId", "content", "timestamp"]
        read_only_fields = ["id", "senderId", "timestamp"]

    def create(self, validated_data):
        return super().create(validated_data)
