# Protocolo Jake Tyler

App para acompanhar o protocolo de 8 semanas: treino de força, dieta de 6 refeições, suplementação e atividades complementares. A tela "Hoje" registra o dia atual, "Progresso" mostra um heatmap e estatísticas de conclusão, e "Config" permite editar o conteúdo do plano (treino, dieta, suplementos) colando JSON.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) para ver o app.

Antes do primeiro uso, crie o schema do banco com `db/schema.sql` e rode `npm run seed` para popular o conteúdo inicial (programa, treinos, refeições e suplementos).

## Testes

```bash
npm test
```

## Editando o conteúdo do plano

A página `/settings` permite editar treino, dieta e suplementos colando JSON diretamente — sem precisar mexer no banco de dados manualmente.
