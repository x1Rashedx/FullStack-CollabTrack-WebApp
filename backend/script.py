from api.models import Team

for team in Team.objects.all():
    # Get all project IDs belonging to this team
    project_ids = list(team.projects.values_list('id', flat=True))
    # Convert UUIDs to strings for frontend
    team.project_ids = [str(pid) for pid in project_ids]
    team.save()

print("All teams updated with their project IDs!")
