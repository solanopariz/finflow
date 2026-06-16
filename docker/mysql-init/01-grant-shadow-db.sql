-- O Prisma Migrate (`prisma migrate dev`) cria um "shadow database" temporário
-- para detectar drift do schema. O usuário criado pelo MySQL_USER do compose só
-- tem acesso ao banco `finflow`, então concedemos privilégios globais para que
-- ele possa criar/derrubar o shadow database. Uso apenas em desenvolvimento local.
GRANT ALL PRIVILEGES ON *.* TO 'finflow'@'%';
FLUSH PRIVILEGES;
