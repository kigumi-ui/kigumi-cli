# Studio's defaults pass contrast, and one that differs from Web Awesome's is exported

Studio's defaults are Web Awesome's own, and the export writes only what
differs from them, so an untouched Studio exports an empty `theme.css` and a
project paints Web Awesome's theme. One of those defaults fails the contrast
check Studio runs on every theme: in dark mode the form control border
(neutral-40, `#545868`) on its background (neutral-05, `#101219`) is 2.64:1,
under the 3:1 WCAG 2.1 AA asks of a control's boundary. The Studio console
showed every visitor a failing pair before they had changed anything.

Studio's dark default is now neutral-50 (`#717584`, 4.07:1), one step
lighter in Web Awesome's own palette. A property definition records Web
Awesome's default where Studio's differs (`webAwesomeDefault`), and the
export compares against that: Studio's value is written also when the user
never touched it, and a value set back to Web Awesome's is left out. Every
other property exports exactly as before.

Studio's defaults follow Web Awesome's except where one fails Studio's
contrast check; such a default is recorded and always exported.

## Considered Options

**Keep Web Awesome's default and label the pair** (rejected): honest about
where the value comes from, but every exported theme keeps failing 1.4.11 in
dark mode, and Studio exists to hand over a theme that passes.

**Change Studio's default only** (rejected): the console would show no
failing pair while an untouched theme exports nothing for it, so a project
still paints Web Awesome's failing border. The console would claim a pass
the export does not ship.

## Consequences

An untouched Studio's `theme.css` holds one line under `.wa-dark`, and the
Customize theme CSS dialog shows it instead of "No changes from the default
theme yet". Deleting that line in the dialog puts the value back to Studio's
default, which is written again; a project that wants Web Awesome's border
writes `#545868`, which the export then leaves out. A `theme.css` without the
line (an export from before, or Web Awesome's own) reads as Studio's default.

Two baselines now differ for this value, and each has one job. The sidebar's
"modified" and Reset compare against Studio's default, so a fresh Studio
shows the border unmodified although its export writes it. The export
compares against what a project paints without the line, so a border set to
Web Awesome's shows as modified and is left out; the project paints the same
colour either way.
