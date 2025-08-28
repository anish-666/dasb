insert into agents (id, tenant_id, name, provider_agent_id, active)
values ('agent_1','t_demo','Primary Agent','8c87d6d3-e607-42d1-bf32-3c7058cab0c0',true)
on conflict (id) do nothing;

insert into campaigns (id, tenant_id, name, status, total, completed)
values (gen_random_uuid(),'t_demo','Warm Leads','queued',100,0);

insert into conversations (id, tenant_id, agent_id, customer_number, status, duration_seconds)
values (gen_random_uuid(),'t_demo','agent_1','+918000000000','completed',120);

insert into calls (id, tenant_id, agent_id, customer_number, success, duration_seconds)
values (gen_random_uuid(),'t_demo','agent_1','+918000000000',true,180);
