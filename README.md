# js-ppv2
Calculate pp for old ppv2 versions.

this code is very messy and thrown together from other random repos. pls dont judge.
probably wont push to npm.

## Usage

Example usage:

```js
import * as parser from "osu-parser"
import * as util from "util"
import { Beatmap, PPCalculator } from "js-ppv2"

// Use osu-parser to parse the map
const path = "path/to/beatmap"
const parseFile = util.promisify(parser.parseFile)
const parsed = await parseFile(path)

const beatmap = Beatmap.fromOsuParserObject(parsed)
const Calculator = PPCalculator.create("2014-05-11")

// set acc, mods(enum), combo and misses
const pp = Calculator.calculate(beatmap, 99.23%, 16, 727, 5)

console.log(pp)
```

## Versions:

- 2014-01-27
    - First release of ppv2
- 2014-02-09
    - Increase pp-value of scores which excel in one category.
    - Increase the aim bonus of FlashLight slightly.
    - Change tuning of category weighting slightly.
- 2014-02-28
    - Fix Hidden and FlashLight giving an additional small bonus to aim instead of acc.
- 2014-03-03
    - Fix some standard beatmaps getting too high aim pp values.
- 2014-05-11
    - Analytically simplify accuracy formula for standard. (Same behaviour.)
- 2014-06-09
    - 1.5x the new star difficulty.
    - Update the pp processor to generate same results with the 1.5x higher beatmap difficulty.
- 2014-06-29
    - Slightly reduce value of aim and slightly increase value of accuracy in osu! standard.
- 2014-07-22
    - Improve beatmap length scaling in osu! standard performance points.
- 2015-02-10
    - Increase the star difficulty of very small hit objects in standard mode.
    - Make FlashLight pp bonus depend on map length.
    - Make bonus for high approach rates start at 10 33 rather than 10.
- 2015-02-12
    - scale pp slightly up to prevent people from losing pp on average.
- 2015-02-16
    - Restore the magnitude of the AR11 aim bonus in standard mode back to 30% from 20%.
- 2015-04-04
    - Reduce difficulty bonus of very small circles slightly.
