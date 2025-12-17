from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import (
    UserViewSet, TeamViewSet, ProjectViewSet, ColumnViewSet, TaskViewSet,
    AttachmentViewSet, DirectMessageViewSet, 
    AllDataView, SubtaskViewSet, NotificationViewSet, PushTokenViewSet, FolderViewSet,
)

router = DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"teams", TeamViewSet)
router.register(r"projects", ProjectViewSet)
router.register(r"columns", ColumnViewSet)
router.register(r"tasks", TaskViewSet)
router.register(r"attachments", AttachmentViewSet)
router.register(r"messages", DirectMessageViewSet)
router.register(r"notifications", NotificationViewSet)
router.register(r"push-tokens", PushTokenViewSet)
router.register(r"folders", FolderViewSet)
router.register(r'data', AllDataView, basename='all-data')

tasks_router = routers.NestedDefaultRouter(router, r"tasks", lookup="task")
tasks_router.register(r"subtasks", SubtaskViewSet, basename="task-subtasks")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(tasks_router.urls)),
]