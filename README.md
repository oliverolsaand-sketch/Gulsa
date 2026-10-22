# Gulsa — portfolio site

A scroll-driven portfolio for Gulsa, a Minecraft video editor and thumbnail
designer. Plain HTML, CSS and JavaScript. No build step, no dependencies, no
framework.

## Running it

The two scrubbed sequences load their frames over HTTP, so use a local server
rather than opening the file directly:

```
python3 -m http.server 8000
```

Then go to http://localhost:8000

## Layout

```
index.html            markup
css/style.css         all styling
js/
  hero.js             scroll-scrubbed opening sequence
  turntable.js        character turntable
  work.js             project cards
  feed.js             thumbnail field
  contact.js          click-to-copy handles
  about.js            word-by-word bio reveal
  reveal.js           fade-in-on-scroll
assets/
  hero/               240 frames, 1920x1080
  turntable/          121 frames, 960x1440
  feed/               24 thumbnails, 600px
  work/               project card media
  about.jpg           About background, 1920px wide
```

## The scrubbed sections

Both the opening sequence and the turntable are image sequences painted to a
canvas, with scroll position mapped to a frame index. Frames on a canvas
rather than a video with currentTime, because video seeking can't keep up with
a scroll wheel; it stutters and lags behind the cursor, while painting an
already-decoded image is instant.

Each section pins itself with position: sticky and sets its own track height.
That height is a fixed scroll distance (SCRUB_DISTANCE), not frames x pixels,
so changing the frame count doesn't change how long the section takes to
scroll through.

Frames load a few at a time, in order. Scrolling unlocks once the opening
stretch is buffered rather than waiting for the whole sequence.

Both canvases set imageSmoothingQuality to high. Browsers default to a cheap
filter when scaling a drawImage call, and every frame here is scaled to fit
the viewport. It has to be set again after each resize, because resizing the
backing store resets the context.

## How the sizes were chosen

Two limits shape this, and neither is disk space.

hero.js keeps every decoded frame in an array. Decoded RGBA, 240 frames at
1920x1080 is roughly 1.9 GB; at 2560x1440 it would be about 3.3 GB, which is
enough to crash a phone. Memory, not file size, is what caps frame resolution.
To go higher you would first need to release frames outside a window around
the current index.

Everything else is sized to how large it actually renders. The feed thumbnails
top out at 300px on screen, so 600px covers a retina display and their native
1920px was several megabytes buying nothing. The About photo sits behind a
scrim at 42% brightness, so it doesn't need its full 2752px either.

The opening sequence is at -q:v 4 rather than 2 because it is 240 frames, and
every kilobyte there is multiplied 240 times. The turntable stays at 3: it is flat
colour, which is where JPEG artifacts show up most.

## Where the images come from

- Opening sequence: from story.mp4, 240 frames at 1920x1080. The footage is
  1280x720, so that's its real ceiling. Scaling up with lanczos still beats
  the filter the browser would use to fit each frame to the viewport, and it
  means the canvas scales down rather than up on most screens. Denoise first
  so the JPEG doesn't spend bits on the source's compression noise, then a
  small unsharp to restore the edge the scale-up softens.
- Character turntable: from the original render. Cropped to the character
  (which also drops the watermark), graded so the background matches the
  site's black instead of the render's dark grey, scaled to 960x1440.
- Feed thumbnails: from the full-resolution PNG originals.
- Project card clips: 720x406, the only copies available.

Regenerating either sequence:

```
# opening sequence
ffmpeg -i story.mp4 \
  -vf "select='not(mod(n\,3))',hqdn3d=1.5:1.5:6:6,scale=1920:1080:flags=lanczos,unsharp=5:5:0.55:5:5:0.0" \
  -fps_mode passthrough -q:v 4 assets/hero/%04d.jpg

# character turntable
ffmpeg -i render.mp4 \
  -vf "crop=479:718:400:3,scale=960:1440:flags=lanczos,curves=all='0/0 0.149/0.031 0.5/0.5 1/1'" \
  -fps_mode passthrough -q:v 3 assets/turntable/%04d.jpg
```

## Editing content

- Bio, pricing, reviews: plain markup in index.html.
- Handles: the data-copy attribute on each .contact-tab button is what gets
  copied. The visible label is the span next to it.
- Thumbnails: drop replacements into assets/feed/ and update SHEET_SRC at the
  top of js/feed.js. SHEET_SHAPE below it sets whether each lays out wide,
  square or as a banner.
- New opening footage: export frames into assets/hero/ numbered from 0001.jpg
  and change the loop count at the top of js/hero.js.

## Deploying

Static site, so anything that serves files will host it.

- Netlify: drag this folder onto https://app.netlify.com/drop, then add your
  domain under Site settings, Domain management.
- Any web host: upload the contents to the site root, usually public_html or
  www.

## Notes

- The thumbnail field is a pointer trail. Thumbnails drop where the cursor
  moves and fade after about a second and a half. On touch it says "Drag
  across". Nothing shows until someone moves across it.
- Animations respect prefers-reduced-motion: the scrubbed sequences stop
  easing and the thumbnail field lays out as a flat grid.
- No cookies, no analytics, no third-party scripts. The only external request
  is the Great Vibes webfont, used for the signature.
