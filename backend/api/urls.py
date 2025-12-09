from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, TeamViewSet, ProjectViewSet, ColumnViewSet, TaskViewSet,
    AttachmentViewSet, CommentViewSet, ChatMessageViewSet, DirectMessageViewSet, AllDataView, 
    # new
    NotificationViewSet, PushTokenViewSet,
)

router = DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"teams", TeamViewSet)
router.register(r"projects", ProjectViewSet)
router.register(r"columns", ColumnViewSet)
router.register(r"tasks", TaskViewSet)
router.register(r"attachments", AttachmentViewSet)
router.register(r"comments", CommentViewSet)
router.register(r"chatmessages", ChatMessageViewSet)
router.register(r"messages", DirectMessageViewSet)
router.register(r"notifications", NotificationViewSet)
router.register(r"push-tokens", PushTokenViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("data/", AllDataView.as_view(), name="all-data"),
    #path("projects/<uuid:project_id>/column/update/", update_column),
    #path("projects/<uuid:project_id>/chatmessages/", send_chat_message),
]