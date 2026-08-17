# Development Workflow

## Git Strategy
We utilize a feature-branch workflow.

### Branches
- **`main`**: Production-ready code. Stable and tested.
- **`develop`**: Integration branch. All features merge here first.
- **Feature Branches**: Named `feature/[T1|T2|T3]-feature-name` (e.g., `feature/T1-screenshot-analyzer`).

### Standard Workflow
1. **Pull Latest**: Always ensure your local `develop` is up to date.
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. **Branch**: Create a new feature branch from `develop`.
   ```bash
   git checkout -b feature/T2-url-scanner
   ```
3. **Develop & Test**: Write code. Reuse common components from `src/components/common`. Run `npm run dev` and test your UI against the guidelines.
4. **Commit**: Make small, logical commits with clear messages.
   ```bash
   git add .
   git commit -m "feat(url-scanner): implement input validation"
   ```
5. **Push**: Push your branch to the remote repository.
   ```bash
   git push origin feature/T2-url-scanner
   ```
6. **Pull Request**: Open a PR targeting the `develop` branch. Request reviews from other teams.
7. **Merge**: Once approved, merge into `develop`.

## Best Practices
- **Never push directly to `main` or `develop`.**
- **Do not duplicate shared components.** If you build a nice chart or widget, parameterize it and move it to `src/components/common` or `src/components/charts`.
- **Communicate.** If a core layout or routing change is needed, discuss it with the team first to prevent merge conflicts.
