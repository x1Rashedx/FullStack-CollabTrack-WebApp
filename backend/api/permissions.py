from rest_framework import permissions
from .models import TeamMember

class IsTeamAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # obj is a Team instance
        try:
            tm = TeamMember.objects.get(team=obj, user=request.user)
            return tm.role == "admin"
        except TeamMember.DoesNotExist:
            return False
