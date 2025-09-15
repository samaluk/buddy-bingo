-- Custom SQL migration file, put you code below! --
alter
  publication supabase_realtime add table statements;

alter
  publication supabase_realtime add table players;

alter
  publication supabase_realtime add table votes;

alter table
  players replica identity full;

alter table
  votes replica identity full;

alter table
  statements replica identity full;