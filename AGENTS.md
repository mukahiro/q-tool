<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Instructions for AI Agents

You are working on the **q-tool** project. Before performing any tasks, you MUST read and adhere to the project documentation located in the `/docs` directory.

## Essential Documentation
- **Requirements:** [docs/requirements.md](docs/requirements.md) - Understand what we are building.
- **Tech Stack:** [docs/tech-stack.md](docs/tech-stack.md) - Follow the decided technology choices.
- **Database Design:** [docs/database-design.md](docs/database-design.md) - Refer to the schema before modifying data models.
- **Architecture Strategy:** [docs/architecture-strategy.md](docs/architecture-strategy.md) - Follow the feature-driven directory structure and team rules.

## Core Mandates
1. **Feature-Driven Structure:** Always place new components and logic within `src/features/[feature_name]/` unless they are truly global.
2. **Data & Logic Separation:** Use Prisma for data types and Server Actions for logic. Do not create class-based entities.
3. **Beginner Friendly:** Keep code simple, idiomatic, and well-commented to support team members of all skill levels.
4. **Japanese Documentation:** Maintain and update documentation in Japanese as requested by the user.
