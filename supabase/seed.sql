-- Datos de demostración. Crea primero usuarios en Authentication y cambia estos UUID por sus IDs.
-- insert into public.profiles (id, full_name, role) values ('UUID-DEL-ADMIN','Administrador','admin');
insert into public.clients(full_name,phone,email,identification,birth_date,notes) values
 ('María González López','5551234567','maria@example.com','INE-MGL-001','1988-05-15','Cliente de demostración'),
 ('Carlos Ramírez Soto','5552348901','carlos@example.com','INE-CRS-002','1985-11-20','Prefiere transferencia');
-- Tras crear un crédito, genere las parcialidades en el frontend y guárdelas en installments.
