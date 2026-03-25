insert into policy_intel_workspaces (slug, name)
values ('demo-federal-texas', 'Demo Federal + Texas Workspace')
on conflict (slug) do nothing;
