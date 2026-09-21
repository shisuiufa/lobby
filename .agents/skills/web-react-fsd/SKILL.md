---
name: web-react-fsd
description: Правила разработки React 19 интерфейса web в архитектуре FSD.
---

# Web: React + FSD

## Стек и источники

Текущий `web` использует React 19, React Router 7, TanStack Query 5, Zustand 5, React Hook Form, Zod, Tailwind и Steiger.

- React component hierarchy and one-way data flow: https://react.dev/learn/thinking-in-react
- React API reference: https://react.dev/reference/react
- TanStack Query React docs: https://tanstack.com/query/latest/docs/framework/react/overview
- FSD conventions are enforced locally by `steiger src`; follow the repository configuration before inventing a layer.

## Границы FSD

- `app` — providers, router, global styles and application bootstrap.
- `pages` — composition of a screen; page does not become a dumping ground for domain logic.
- `widgets` — large reusable screen sections.
- `features` — user actions with business value.
- `entities` — domain models and their UI/API fragments.
- `shared` — generic UI, API client, utilities and resources with no business ownership.

Импортируй только вниз по слоям. Слой не должен импортировать вышестоящий слой или напрямую обходить публичный `index.ts` другого слайса.

## Компоненты

- Один компонент отвечает за одну смысловую часть UI.
- Разделяй загрузку данных, orchestration и presentation.
- Компонент страницы собирает композицию; не помещай в него запросы, сложную валидацию, форматирование и несколько независимых интерактивных сценариев.
- При росте компонента выделяй дочерние компоненты, hooks, schema и types рядом со слайсом.
- Предпочитай композицию и явные props вместо универсального компонента с десятками флагов.
- Не превышай 200 строк без явного обоснования.

## Состояние и данные

- Локальное состояние — только для локального UI.
- URL state — фильтры, pagination и состояние, которым можно поделиться ссылкой.
- TanStack Query — server state, cache, loading/error и mutations.
- Zustand — только действительно общее клиентское состояние; не дублируй server state.
- Zod + React Hook Form — формы и boundary validation.
- Всегда обрабатывай loading, error, empty и success states.

## UI quality

Сохраняй keyboard accessibility, корректные labels, focus management, семантические элементы, responsive layout и доступный контраст. Не используй кликабельные `div`, цвет как единственный сигнал или декоративную сложность без пользовательской пользы.

## Проверки

```text
yarn workspace web typecheck
yarn workspace web lint
yarn workspace web build
yarn workspace web steiger
```
