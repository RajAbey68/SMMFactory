# Contributing & Development Policy

Thank you for contributing! To maintain security, build consistency, and code quality, we strictly enforce a **Remote Cloud Development Environment (CDE)** policy for this repository.

## ☁️ The Remote-First Policy

**Do not develop or install dependencies locally on your Mac/Windows laptop.**

All code compilation, dependency management (`npm install`), and testing must be performed on the designated Remote DevServer. 

### Why do we do this?
1. **Production Parity:** Our DevServer exactly mirrors the Linux environment of our live production servers, eliminating "it works on my machine" bugs.
2. **Security & Cleanliness:** Your local hardware remains pristine. No need to pollute your host OS with various versions of Node, Python, or Docker.
3. **Speed & Power:** Heavy tasks like automated browser testing (Playwright) or dependency compilation are offloaded to a high-powered 8-core server with data-center bandwidth.

### How to get started:
1. Clone the repository (if not already present on the DevServer).
2. Connect your IDE (Antigravity IDE or VS Code) to the remote DevServer via **Remote SSH**.
3. Open the workspace. All terminals spawned will now automatically execute on the remote Linux environment.
4. Run your standard commands (`npm install`, `npm run dev`) through the remote terminal.
