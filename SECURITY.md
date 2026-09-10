# Security Policy

## Supported Versions

Security fixes land on the latest released minor version. Older versions are not patched.

## Reporting a Vulnerability

Please do not open a public issue for security problems.

Report vulnerabilities through
[GitHub's private security advisory form](https://github.com/kigumi-ui/kigumi-cli/security/advisories/new),
or by email to legal@kigumi.style.

Include what you have: the affected version, the steps to reproduce, and what an attacker could achieve.
A proof of concept helps but is not required.

You can expect an initial response within a week. If the report is confirmed, you will get an estimate
for the fix, and credit in the release notes unless you prefer to stay anonymous.

## Scope

Kigumi is a command line tool that writes files into a user's project, reads configuration, and can
fetch component definitions from third-party registries. Findings in these areas are especially
relevant:

- **Path handling.** Registry-supplied file paths must never resolve outside the registry root or write
  outside the target project. Both the registry schema and the fetch layer guard against traversal.
- **Community registries.** A malicious `registry.json` is untrusted input. Anything it can do beyond
  installing files into the declared component directory is a bug.
- **Credential handling.** The CLI reads a Web Awesome Pro npm token from the environment, a project
  `.env`, or a global `.npmrc`. A token appearing in logs, error output, generated files, or being sent
  anywhere other than the Web Awesome registry is a bug.
- **Generated code.** Component names and user-supplied values that flow into generated files should
  not permit code injection into a consuming project.

## Out of Scope

- Vulnerabilities in Web Awesome itself. Report those to
  [Web Awesome](https://webawesome.com).
- Issues that require an attacker to already have write access to the user's machine or repository.
- Findings from automated scanners without a demonstrated impact.
