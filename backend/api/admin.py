from django.contrib import admin
from .models import (
    User, Attachment, Comment, Task, Column, ChatMessage,
    TeamMember, Team, Project, DirectMessage
)
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin


class UserAdmin(BaseUserAdmin):
    ordering = ["email"]
    list_display = ["email", "name", "is_staff", "is_superuser", "is_active"]
    search_fields = ["email", "name"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("name", "avatar_url", "phone", "gender")}),
        ("Permissions", {"fields": ("is_staff", "is_superuser", "is_active", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "name", "password1", "password2", "is_staff", "is_superuser", "is_active"),
        }),
    )

admin.site.register(User, UserAdmin)
admin.site.register(Attachment)
admin.site.register(Comment)
admin.site.register(Task)
admin.site.register(Column)
admin.site.register(ChatMessage)
admin.site.register(TeamMember)
admin.site.register(Team)
admin.site.register(Project)
admin.site.register(DirectMessage)
