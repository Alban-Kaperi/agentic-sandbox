# Diagrams

`loop.workflow.json` is the source of the "every station" map used in the workshop deck. It is an [archify](https://github.com/tt-a1i/archify) workflow spec (schema v2). Regenerate with:

```
git clone --depth 1 https://github.com/tt-a1i/archify
node archify/archify/bin/archify.mjs deliver workflow docs/diagrams/loop.workflow.json loop.html --quality showcase
```

`loop.svg` is the rendered light-theme export embedded in the deck.
