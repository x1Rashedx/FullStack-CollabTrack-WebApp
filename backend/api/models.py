import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True, null=True)

    GENDER_CHOICES = [
        ("male", "male"),
        ("female", "female"),
        ("prefer-not-to-say", "prefer-not-to-say"),
    ]
    gender = models.CharField(max_length=30, choices=GENDER_CHOICES, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"       # login with email
    REQUIRED_FIELDS = ["name"]     # mandatory fields for superuser

    def __str__(self):
        return self.name or str(self.id)

class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)


class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    team = models.ForeignKey("Team", on_delete=models.CASCADE, related_name="projects")


class Column(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="columns")
    title = models.CharField(max_length=255)
    # store ordering here as array of task UUID hex strings to match frontend:
    task_ids = models.JSONField(default=list)  # ["uuid1", "uuid2", ...]

    order = models.PositiveIntegerField(default=0)


class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    assignees = models.ManyToManyField(User, blank=True, related_name="assigned_tasks")

    due_date = models.DateTimeField(null=True, blank=True)
    PRIORITY_CHOICES = [("low", "low"), ("medium", "medium"), ("high", "high")]
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")

    tags = models.JSONField(default=list, blank=True)       # array<string>
    attachments = models.ManyToManyField(Attachment, blank=True)
    comments = models.ManyToManyField(Comment, blank=True)

    weight = models.IntegerField(default=1)
    completed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="chat_messages")
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)


class TeamMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey("Team", on_delete=models.CASCADE, related_name="team_members")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ROLE_CHOICES = [("admin", "admin"), ("member", "member")]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")

    class Meta:
        unique_together = ("team", "user")


class Team(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=255, blank=True)
    # join_requests: list of user uuid hex strings (matching your TS type string[])
    join_requests = models.JSONField(default=list, blank=True)  # ["user_uuid_hex", ...]

    # convenience: project ids can be derived from Project but we keep JSON to match frontend if needed
    project_ids = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.name


class DirectMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
