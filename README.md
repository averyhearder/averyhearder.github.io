# A Day in Bloom

An interactive portfolio garden by Avery Hearder. Plain HTML, CSS and JavaScript, with no build tools, so it works directly on GitHub Pages.

## Preview it

**Quickest:** double-click `index.html` in File Explorer. It opens in your web browser.

**Better (auto-refreshes when you save):**
1. In VS Code, open the Extensions panel (`Ctrl+Shift+X`), search **Live Server** (by Ritwick Dey) and install it.
2. Right-click `index.html` → **Open with Live Server**.

## Folder map

```
index.html              Welcome screen, garden scene, Work/About/Contact panels
css/base.css            Colours, fonts, navigation, buttons (change the palette here)
css/paper.css           Shared paper pieces: washi tape, paper clips, polaroids, stickers
css/garden.css          Garden scene, garden animations, welcome screen, instruction bar
css/panels.css          Work and Contact panels
css/journal.css         About Me junk journal (pages swing in from the spine; corners lift a little near the pointer)
css/field-journal.css   Project "design field journal" pages (sample: Snapdragon)
css/project.css         Older placeholder layout (Ranunculus, Cosmos) until approved
js/scenery.js           Paints the willow, flower rows, gravel and wildflowers
js/main.js              Navigation: welcome → garden, opening panels, journal pages
js/project-bloom.js     Living project pages: a vine of each project's flower that grows as you scroll, soft reveals, and a theme per page
                        (LumiEdge: burning dividers, embers, fireplace crackle · Modunest: aurora curtains, twilight band, interactive aura floor plan, wind ambience ·
                        Lucy's Cottage: pencil lines drawn by a travelling pencil, sketches, sunlight and dapples, drifting cosmos petals with gusts)
css/project-bloom.css   Their styles (vines, sprigs, divider effects, atmosphere layers, the aura plan and legend, and the sound button)
js/behind-bloom.js      "Behind the bloom ♡": tiny hand-drawn icons under headings open scrapbook designer's notes (all three projects;
                        each note's words are a <dialog class="bloom-note"> in the project page itself)
css/behind-bloom.css    Their styles (the pressed-flower buttons, cream stationery, washi tape, paper unfolding)
js/bloom-cursor.js      The floral cursor on every page (desktop mouse only): a tiny pink cosmos with a slim sage leaf whose
                        sharp tip is the click point. The pointer is the browser's own cursor (no lag); this script turns
                        it on for a mouse, lets 2-3 petals drift on a click, and keeps the text cursor while selecting
assets/cursor/          The cursor's three pictures: bloom (everywhere), bloom-hover (clickable things, with the sage halo)
                        and bloom-press (pressing and dragging). The leaf tip, at 2,2, is the click point.
js/lightbox.js          Click to enlarge on the project pages: every project image opens whole, at full quality, in a cream
                        lightbox with its caption; zoom (wheel, pinch, double-click/tap, + / −), drag, arrows, Esc
assets/images/**/web/   Lighter JPEG copies (same size) of the PNG photos and renderings, which the pages show; the
                        original PNGs stay beside them and open in the lightbox (data-full). If you replace an image,
                        update both (or point the page back at the PNG).
css/lightbox.css        Its styles, and the little magnifying glass on each image
js/copy-email.js        Copy email ♡ on the Contact panel ("copied ♡", or the address selected if copying fails)
js/tab-bloom.js         The living browser tab on the garden page: its icon and title follow the #address (garden,
                        greenhouse, lake, willow, notebook...), including Back/Forward. Project pages set theirs in HTML.
assets/favicons/        The tab icons: garden (pink sprout), snapdragon, ranunculus, greenhouse (potted flower), willow
                        (leaf), lake (water lily). Lucy's Cottage uses the site's own pink cosmos, assets/favicon.svg.
css/bloom-cursor.css    Which cursor picture shows where (and the normal text cursor kept for typing and selecting text)
js/intro.js             The opening transition: one cosmos, then an overgrown flower garden fills the screen and parts as you step through
css/intro.css           The opening transition's growing, layering and push-through animations
js/ambience.js          Hummingbird and chickadee visits; clicking the feeder or birdbath bowl (a flutter, a splash)
js/game.js              Growing game: plant → water → sunshine → bloom (progress saved in the browser), with phone arrows toward the next thing needed;
                        grown flowers nod once when a visitor comes back from a project page
js/flowers.js           The three blooming flowers (Snapdragon, Ranunculus, Cosmos) drawn in SVG
js/greenhouse.js        Stepping inside the greenhouse; "Growing Soon" shelf list (UPCOMING_PROJECTS)
js/greenhouse-flowers.js  Paints the greenhouse's flowers, bouquets, hanging plants, vines, rug, stool and bouquet bar cart
js/bouquet.js           "Make a bouquet" card at the greenhouse's bouquet bar (finished bouquet is remembered); SLOTS sets where each
                        new flower goes, and each one shifts a little to hide as little as possible of the flowers already there
js/garden-extras.js     Potted flowers, buckets, stacked pots, petals and edge blooms in the main garden
css/greenhouse.css      The greenhouse room, its shelf, sketchbook and note
js/mode.js              Daytime / Golden Hour toggle (remembered for the current visit)
js/lake.js              "A Few Thoughts from the Lake": the lakeside scene, boat ride, fish and the five thoughts (LAKE_THOUGHTS)
css/lake.css            The lakeside scene, the boat ride and its cards
js/willow.js            "The Wishing Willow": the nook beneath the willow, its rope swing, the wish card at the desk and up to eight wishes hung on the branches (saved privately in the visitor's own browser with localStorage, key aDayInBloom.willow.v1; never sent anywhere)
css/willow.css          The Wishing Willow's scene, light, swing, wish card, ribbons and hanging notes
js/room-hints.js        Phones and tablets: little arrows in the willow and the greenhouse (the swing, the wish desk, the music, the bouquet bar);
                        each one retires once that feature is used (remembered in the visitor's browser, key aDayInBloom.hints.v1)
css/landscape.css       Phones turned sideways: a slimmer header, instructions, messages and room buttons; the garden scrolls up to the sun
js/sound.js             Garden sounds (lake, wind, birds, crickets) and gardening sound effects; off until turned on
css/golden-hour.css     Golden Hour sunset layers, fireflies and fairy lights
js/little-things.js     Notebook "Little Things" page: recipe card + PLAYLIST_URL for the record
js/project.js           Highlights the current section on project pages
projects/*.html         Project pages
assets/favicon.svg      The cosmos browser-tab icon
assets/images/          Put your renderings, drawings and photos here
assets/social/          Link-preview pictures (1200 × 630) for the site and each project, shown when a link is shared
.gitignore              Keeps Windows/OneDrive files (desktop.ini) out of the published site
```

## Moving things in the garden

The garden is 1600 × 1000 "garden units". Each object in `index.html` has
`style="--x:…; --y:…; --w:…"`, which sets its left edge, top edge and width.
Change those numbers to move or resize it.

## Publishing (GitHub Pages)

1. Create a **public** repository on GitHub and upload everything in this folder (the
   `.gitignore` leaves out the Windows `desktop.ini` files).
2. In the repository: **Settings → Pages → Build and deployment → Deploy from a branch**,
   choose `main` and `/ (root)`, then **Save**. After a minute or two the address appears there,
   for example `https://USERNAME.github.io/REPOSITORY/`.
3. **Link previews:** every page's preview tags use `__SITE_URL__` as a stand-in for that address.
   Replace it everywhere with the real address, ending in a slash. In PowerShell, from this folder:

   ```powershell
   $url = 'https://USERNAME.github.io/REPOSITORY/'
   'index.html','projects\snapdragon.html','projects\ranunculus.html','projects\cosmos.html' | ForEach-Object {
     $t = [IO.File]::ReadAllText((Resolve-Path $_)); [IO.File]::WriteAllText((Resolve-Path $_), $t.Replace('__SITE_URL__', $url), (New-Object Text.UTF8Encoding $false)) }
   ```

   Then upload those four files again.
4. Check the previews with [opengraph.xyz](https://www.opengraph.xyz/) or LinkedIn's
   [Post Inspector](https://www.linkedin.com/post-inspector/). Apps keep old previews for a while,
   so test with a link you haven't shared before.

Shareable links: the garden is the address itself; each project has its own page
(`projects/snapdragon.html`, `projects/ranunculus.html`, `projects/cosmos.html`), and places in the
garden can be linked directly by adding `#greenhouse`, `#lake`, `#willow`, `#work`, `#about` or `#contact`.
