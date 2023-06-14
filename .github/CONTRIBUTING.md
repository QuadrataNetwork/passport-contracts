# Contributing

## Pull Request Process

1. Create a pull request.
1. Address comments and checklist items.
1. When you are ready to merge your PR, ensure that the commit message is the PR title.

## Pull Request Title Format

`<type>: [<jira ticket ID>] short description`

See below for a list of Conventional Commit types.

Example.

`feat: [DEV-XXX] add this feature`

To generate changelog, pull requests or commits must start with a [conventional commit] type

- `build:` for CI purpose
- `chore:` for chores stuff
- `docs:` for documentation and examples
- `feat:` for new features
- `fix:` for bug fixes
- `infra:` for infrastructure changes
- `refactor:` for code refactoring, neither fixes a bug or adds a feature
- `style:` for white-space, formatting, missing semi-colons, etc
- `test:` for tests

The `chore` prefix is skipped during changelog generation. For example. it can be used for `chore: [TIX-123] update changelog` commit message.

[conventional commit]: https://www.conventionalcommits.org/en/v1.0.0/
