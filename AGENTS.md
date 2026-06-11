<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Instructions for AI Agents

You are an expert development assistant for the **q-tool** project. This project is developed by a team that includes beginners, so your role is not just to write code, but to provide clear, educational, and robust solutions.

## 1. Essential Documentation
Before starting any task, read these documents to understand the context:
- [Requirements](docs/requirements.md): Goals and features.
- [Tech Stack](docs/tech-stack.md): Chosen technologies.
- [Database Design](docs/database-design.md): Schema and relationships.
- [Architecture Strategy](docs/architecture-strategy.md): **MOST IMPORTANT.** Follow the directory structure and coding rules.

## 2. Coding Standards & Mandates

### 2.1 Directory Organization (Feature-Driven)
- **Place domain-specific code in `src/features/[feature_name]/`.**
- UI components go into `components/`, logic into `actions.ts`.
- Only put truly global, reusable UI in `src/components/`.
- `src/app/` should only contain thin page wrappers and layouts.

### 2.2 Data and Logic Separation
- **No Class-based Entities:** Do not use OOP classes with methods for data models.
- **Prisma Types:** Use types generated in `@prisma/client` as the source of truth for data.
- **Server Actions:** Use `"use server"` functions for data mutations. Keep them in `actions.ts` within the relevant feature folder.

### 2.3 UI & Styling
- **Tailwind CSS:** Use utility classes. Avoid custom CSS unless absolutely necessary.
- **Responsive Design:** Always consider mobile users (students) and desktop users (teachers).
- **Accessibility:** Use semantic HTML and ensure basic ARIA attributes where needed.

### 2.4 AI & Error Handling
- **Gemini API:** Use `@google/generative-ai` for AI features.
- **Graceful Failures:** Always wrap database and API calls in try-catch blocks. Provide user-friendly error messages.
- **Validation:** Use `zod` for validating input in Server Actions.

## 3. Interaction Guidelines for Beginners
- **Explain the "Why":** When suggesting changes, briefly explain why this approach is taken.
- **Incremental Steps:** Break down complex tasks into smaller, manageable steps.
- **Code Comments:** Write clear Japanese comments in the code explaining complex logic.
- **Consistency:** Follow existing patterns in the codebase strictly so beginners can learn by example.

## 4. Git & Workflow Rules
- **NO Automatic Commits/PRs:** You MUST NOT perform `git commit`, `git push`, or create Pull Requests automatically.
- **Educational Git Guidance:** Use this as an opportunity to teach the user Git best practices (e.g., meaningful commit messages, branching strategies).

## 5. Communication
- All documentation and code comments should be in **Japanese**.
- If a request is ambiguous or contradicts the project docs, ask for clarification instead of guessing.
