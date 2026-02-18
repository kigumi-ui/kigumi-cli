# Kigumi CLI

> **shadcn/ui for Web Awesome** — Template-based CLI that generates React/Vue/Svelte/Angular wrappers around Web Awesome web components.

For detailed rules and checklists, see [AGENTS.md](AGENTS.md).

## Quality Checks (Stop Hook)

A stop hook at `.claude/hooks/stop-quality-check.sh` runs automatically after each response when source files changed. It runs: type-check → lint → validate:changes → validate:registry → validate:templates → unit tests. Only checks relevant to changed files are triggered. If any check fails, you will be blocked from stopping and must fix the errors first.

## Architecture Overview

```mermaid
flowchart TD
    subgraph Entry["CLI Entry"]
        CLI["src/index.ts\nCommander routing"]
    end

    subgraph Commands["commands/"]
        init["init/\nconfig-builder, file-generator\nmigration, installer"]
        add["add/\ncomponent-selector, validator\ninstaller"]
        theme["theme/\nlist, set, show"]
        doctor["doctor.ts"]
        brand["brand.ts"]
        palette["palette.ts"]
        list["list.ts"]
        status["status.ts"]
    end

    subgraph Frameworks["frameworks/"]
        FW_INDEX["index.ts\nFrameworkRegistry\nlazy-loaded Map"]
        react["react/ReactPlugin"]
        vue["vue/VuePlugin"]
        angular["angular/AngularPlugin (stub)"]
        svelte["svelte/SveltePlugin (stub)"]
    end

    subgraph Utils["utils/"]
        registry["registry.ts\n62+ ComponentDefinitions\nprops, events, slots, methods"]
        template["template.ts\nHandlebars compile + cache\nquoteProp helper"]
        tier["tier.ts\nFree/Pro detection\ndetectTier, detectTierSync"]
        config["config.ts\ncosmiconfig loader\nloadConfig, saveConfig, getConfig"]
        css_meta["css-metadata.ts"]
        detect_fw["detect-framework.ts\ngetProjectInfo"]
        token_mgr["token-manager.ts"]
        regenerate["regenerate.ts"]
    end

    subgraph Schemas["schemas/"]
        schema_config["config.ts — Zod KigumiConfig"]
        schema_options["options.ts — Zod command options"]
        schema_tier["tier.ts — Zod tier types"]
    end

    subgraph Errors["errors/"]
        err_base["base.ts — KigumiError"]
        err_config["config.ts"]
        err_fs["filesystem.ts"]
        err_net["network.ts"]
    end

    subgraph Checks["checks/"]
        check_runner["runner.ts — CheckRunner"]
        check_config["config-checks.ts"]
        check_deps["dependency-checks.ts"]
    end

    subgraph Templates["templates/"]
        tpl_react["react/ — 62 components\n.tsx.hbs, .jsx.hbs\n.test.tsx.hbs, .test.jsx.hbs, .css.hbs"]
        tpl_vue["vue/ — 62 components\n.vue.hbs, .js.vue.hbs\n.test.ts.hbs, .test.js.hbs, .css.hbs"]
    end

    CLI --> Commands
    init --> FW_INDEX
    init --> config
    init --> tier
    init --> template
    init --> detect_fw
    add --> FW_INDEX
    add --> registry
    add --> tier
    add --> template
    add --> check_runner
    theme --> config
    doctor --> config
    doctor --> tier

    FW_INDEX --> react & vue & angular & svelte
    react --> template
    vue --> template
    template --> tpl_react & tpl_vue
    template --> registry
    template --> css_meta

    config --> schema_config
    add --> schema_options
    tier --> schema_tier
    check_runner --> check_config & check_deps
    Commands --> Errors
```

## Command Flows

```mermaid
sequenceDiagram
    participant User
    participant CLI as index.ts
    participant Checks as checks/runner
    participant Config as utils/config
    participant Tier as utils/tier
    participant FW as frameworks/index
    participant Reg as utils/registry
    participant Tpl as utils/template
    participant FS as File System

    Note over User,FS: === kigumi init ===
    User->>CLI: kigumi init [options]
    CLI->>Checks: PackageJsonExistsCheck
    Checks-->>CLI: pass/fail
    CLI->>FW: detectFramework(cwd) — parallel, highest confidence
    FW-->>CLI: FrameworkPlugin
    CLI->>Tier: detectTier(cwd) — reads .env + package.json
    Tier-->>CLI: free | pro
    CLI->>Config: buildConfig (framework + tier + theme + palette)
    CLI->>Config: saveConfig → kigumi.config.json
    CLI->>Tpl: generateProjectFiles (webawesome.ts, layers.css, theme.css)
    Tpl->>FS: write setup files
    CLI->>FW: installDependencies(cwd, pm, deps)
    FW->>FS: execa(pnpm/npm/yarn install)
    CLI-->>User: Success + next steps

    Note over User,FS: === kigumi add button ===
    User->>CLI: kigumi add button [--overwrite]
    CLI->>Checks: ConfigExistsCheck + ConfigValidCheck
    Checks-->>CLI: pass/fail
    CLI->>Config: loadConfig(cwd) → KigumiConfig
    CLI->>Tier: detectTier(cwd)
    Tier-->>CLI: free | pro
    CLI->>Reg: getComponent("button") → ComponentDefinition
    Reg-->>CLI: { name, tagName, props, events, slots, importPath, tier }
    CLI->>FW: plugin.generateComponent(cwd, config, component, options)
    FW->>Tpl: renderTemplate(hbs path, context)
    Tpl->>Tpl: getCompiledTemplate (cached) → Handlebars.compile
    Tpl->>FS: read .hbs from templates/{framework}/{Component}/
    Tpl-->>FW: rendered string
    FW-->>CLI: GeneratedFile[]
    CLI->>FS: write .tsx/.vue + .test + .css
    CLI->>Tpl: updateTypeDeclarations (React only)
    CLI->>Tpl: updateComponentIndex (barrel export)
    CLI-->>User: Added 1 component(s)
```

## Template Pipeline

```mermaid
flowchart LR
    subgraph Input
        HBS["templates/{framework}/{Component}/\n{Component}.tsx.hbs"]
        REG["registry.ts\nComponentDefinition\nname, tagName, props,\nevents, slots, methods"]
        CFG["KigumiConfig\nframework, tier, typescript"]
    end

    subgraph TierResolution["Import Path Resolution"]
        DETECT["detectTierSync(cwd)\nreads .env + package.json"]
        PKG["getWebAwesomePackage(tier)\nfree → @awesome.me/webawesome\npro → @awesome.me/webawesome-pro"]
        REPLACE["importPath.replace(\npackageName pattern,\ncorrect package)"]
    end

    subgraph Processing
        CTX["buildTemplateContext()\n→ { name, tagName,\ndescription, importPath, props }"]
        CACHE["templateCache Map\nkey: absolute path\nvalue: compiled template"]
        COMPILE["Handlebars.compile()\ncached via getCompiledTemplate()"]
        RENDER["template(context)\n→ rendered string"]
    end

    subgraph Helpers["Handlebars Helpers"]
        QP["quoteProp\nhyphenated → 'prop-name'\nnormal → propName"]
    end

    subgraph Output
        COMP[".tsx / .jsx / .vue / .js.vue"]
        TEST[".test.tsx / .test.jsx / .test.ts / .test.js"]
        CSS[".css — from css-metadata.ts\nor component-specific .css.hbs"]
        TYPES["web-awesome.d.ts\nupdateTypeDeclarations\n(React + TS only)"]
        INDEX["index.ts barrel export\nupdateComponentIndex"]
    end

    REG --> CTX
    CFG --> TierResolution
    DETECT --> PKG --> REPLACE
    REPLACE --> CTX
    CTX --> RENDER
    HBS --> COMPILE --> RENDER
    Helpers -.-> COMPILE
    COMPILE --> CACHE
    RENDER --> COMP & TEST & CSS
    COMP --> TYPES & INDEX
```

## Framework Plugin System

```mermaid
flowchart TB
    subgraph Interface["FrameworkPlugin Interface (frameworks/types.ts)"]
        detect["detect(cwd) → DetectionResult\n{ detected, confidence, version }"]
        generate["generateComponent(cwd, config, component, opts)\n→ GeneratedFile[]"]
        setup["generateSetupFiles(cwd, config)\n→ GeneratedFile[]"]
        install["installDependencies(cwd, pm, deps)"]
        validate["validateConfig(config) → ValidationResult"]
    end

    subgraph Registry["FrameworkRegistry (frameworks/index.ts)"]
        MAP["FRAMEWORK_PLUGINS\nMap<string, () => Promise<Plugin>>\nlazy-loaded via dynamic import()"]
        getPlugin["getPlugin(name)"]
        detectFW["detectFramework(cwd)\nparallel detection\nhighest confidence wins"]
        supported["getSupportedFrameworks()\nisSupported(name)"]
    end

    subgraph Plugins["Plugin Implementations"]
        R["ReactPlugin\ndetects: react in package.json\ngenerates: .tsx/.jsx + .test + .css\nsetup: webawesome.ts, vite-env.d.ts"]
        V["VuePlugin\ndetects: vue in package.json\ngenerates: .vue/.js.vue + .test + .css\nsetup: webawesome.ts, shims-vue.d.ts"]
        A["AngularPlugin\ndetects: @angular/core\nSTUB — not fully implemented"]
        S["SveltePlugin\ndetects: svelte\nSTUB — not fully implemented"]
    end

    subgraph Detection["Detection Confidence Levels"]
        HIGH["HIGH: framework in dependencies"]
        MED["MEDIUM: framework config files found"]
        LOW["LOW: framework-like file patterns"]
    end

    MAP -->|"lazy import()"| R & V & A & S
    R & V & A & S -.->|"implements"| Interface
    getPlugin --> MAP
    detectFW --> MAP
    detectFW -.-> Detection
```
