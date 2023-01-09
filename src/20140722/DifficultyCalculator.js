import Vec2 from "../Vec2.js";
import {HitObjectType} from "../Beatmap.js";

const DifficultyType = {"SPEED": 0, "AIM": 1};

// how much strains decay per interval (if the previous interval's peak
// strains after applying decay are still higher than the current one's, 
// they will be used as the peak strains).
const DECAY_BASE = [0.3, 0.15];

// almost the normalized circle diameter (104px)
const DIAMETER_APPROX = 90;

// arbitrary tresholds to determine when a stream is spaced enough that is 
// becomes hard to alternate.
const STREAM_INTERVAL = 110;
const SINGLETAP_INTERVAL = 125;

// used to keep speed and aim balanced between eachother
const WEIGHT_SCALING = [1400, 26.25];

// non-normalized diameter where the circlesize buff starts
const CS_BUFF_TRESHOLD = 30;

// diffcalc hit object
class DiffCalcHitObject {
    // strains start at 1
    strains = [1.0, 1.0];

    // start/end positions normalized on radius
    normStart;
    normEnd;

    constructor(hitObject, radius) {
        this.hitObject = hitObject;
        // strains start at 1
        this.strains = [1, 1];

        // positions are normalized on circle radius so that we can calc as
        // if everything was the same circlesize
        let scalingFactor = 52.0 / radius;

        this.normStart = new Vec2(this.hitObject.position);
        this.normStart.multiply(scalingFactor);

        // ignoring slider lengths doesn't seem to affect star rating too
        // much and speeds up the calculation exponentially
        this.normEnd = this.normStart.clone();
    }

    calculateStrains (prev) {
        this.calculateStrain(prev, DifficultyType.SPEED);
        this.calculateStrain(prev, DifficultyType.AIM);
    }

    calculateStrain (prev,  diffType) {
        let res = 0;
        let timeElapsed = this.hitObject.startTime - prev.hitObject.startTime;
        let decay = Math.pow(DECAY_BASE[diffType], timeElapsed / 1000.0);
        let scaling = WEIGHT_SCALING[diffType];

        if (this.hitObject.type === HitObjectType.Circle ||
        this.hitObject.type === HitObjectType.Slider)
        res = this.spacingWeight(this.normStart.distance(prev.normEnd), diffType) * scaling;

        res /= Math.max(timeElapsed, 50);
        this.strains[diffType] = prev.strains[diffType] * decay + res;
    }

    spacingWeight (distance,  diffType) {
        if (diffType === DifficultyType.AIM)
        return Math.pow(distance, 0.99);

        if (distance > SINGLETAP_INTERVAL) {
        return 2.5;
        }
        if (distance > STREAM_INTERVAL) {
        return 1.6 + 0.9 *
            (distance - STREAM_INTERVAL) /
            (SINGLETAP_INTERVAL - STREAM_INTERVAL);
        }
        if (distance > DIAMETER_APPROX) {
        return 1.2 + 0.4 * (distance - DIAMETER_APPROX) /
            (STREAM_INTERVAL - DIAMETER_APPROX);
        }
        if (distance > DIAMETER_APPROX / 2.0) {
        return 0.95 + 0.25 *
            (distance - DIAMETER_APPROX / 2.0) /
            (DIAMETER_APPROX / 2.0);
        }
        return 0.95;
    }
};


const STAR_SCALING_FACTOR = 0.0675;
const EXTREME_SCALING_FACTOR = 0.5;
const PLAYFIELD_WIDTH = 512; // in osu!pixels

// strains are calculated by analyzing the map in chunks and then taking the
// peak strains in each chunk.
// this is the length of a strain interval in milliseconds.
const  STRAIN_STEP = 400;

// max strains are weighted from highest to lowest, and this is how much the
// weight decays.
const  DECAY_WEIGHT = 0.9;

const calculateDifficulty = (objects, type) => {
    let highestStrains = [];
    let intervalEnd = STRAIN_STEP;
    let maxStrain = 0.0;
    let prev;

    for (let i = 0; i < objects.length; i++) {
        let obj = objects[i];

        // make previous peak strain decay until the current object
        while (obj.hitObject.startTime > intervalEnd) {
        highestStrains.push(maxStrain);

        if (!prev) {
            maxStrain = 0.0;
        } else {
            let decay = Math.pow(DECAY_BASE[type],
            (intervalEnd - prev.hitObject.startTime) / 1000.0);
            maxStrain = prev.strains[type] * decay;
        }

        intervalEnd += STRAIN_STEP;
        }

        // calculate max strain for this interval
        maxStrain = Math.max(maxStrain, obj.strains[type]);
        prev = obj;
    }

    highestStrains.push(maxStrain);

    // sort strains from greatest to lowest
    highestStrains.sort((a, b) => b - a);
    
    let difficulty = 0;
    let weight = 1;

    for (let strain of highestStrains) {
        difficulty += weight * strain
        weight *= DECAY_WEIGHT
    }

    return difficulty
};

export class BeatmapDifficulty {
    aim;
    speed;
    stars;
}

class DifficultyCalculator20140722 {
    calculate(beatmap) {

    if (beatmap.mode != 0)
      throw new Error("This gamemode is not supported");

    const circleRadius = (PLAYFIELD_WIDTH / 16) * (1 - 0.7 *
      (beatmap.circleSize - 5) / 5);

    let objects = [];

    for (let i = 0; i < beatmap.hitObjects.length; i++) {
      objects[i] = new DiffCalcHitObject(beatmap.hitObjects[i], circleRadius);
    }

    let prev = objects[0];
    for (let i = 1; i < objects.length; i++) {
      let o = objects[i];
      o.calculateStrains(prev);

      prev = o;
    }

    const aimDifficulty = calculateDifficulty(objects, DifficultyType.AIM);
    const speedDifficulty = calculateDifficulty(objects, DifficultyType.SPEED);

    // OverallDifficulty is not considered in this algorithm and neither is HpDrainRate. That means, that in this form the algorithm determines how hard it physically is
    // to play the map, assuming, that too much of an error will not lead to a death.
    // It might be desirable to include OverallDifficulty into map difficulty, but in my personal opinion it belongs more to the weighting of the actual peformance
    // and is superfluous in the beatmap difficulty rating.
    // If it were to be considered, then I would look at the hit window of normal HitCircles only, since Sliders and Spinners are (almost) "free" 300s and take map length
    // into account as well.

    

    // The difficulty can be scaled by any desired metric.
    // In osu!tp it gets squared to account for the rapid increase in difficulty as the limit of a human is approached. (Of course it also gets scaled afterwards.)
    // It would not be suitable for a star rating, therefore:

    // The following is a proposal to forge a star rating from 0 to 5. It consists of taking the square root of the difficulty, since by simply scaling the easier
    // 5-star maps would end up with one star.
    const speedStars = Math.sqrt(speedDifficulty) * STAR_SCALING_FACTOR;
    const aimStars = Math.sqrt(aimDifficulty) * STAR_SCALING_FACTOR;

    // Again, from own observations and from the general opinion of the community a map with high speed and low aim (or vice versa) difficulty is harder,
    // than a map with mediocre difficulty in both. Therefore we can not just add both difficulties together, but will introduce a scaling that favors extremes.
    
    const starRating = speedStars + aimStars + Math.abs(speedStars - aimStars) * EXTREME_SCALING_FACTOR;

    // Another approach to this would be taking Speed and Aim separately to a chosen power, which again would be equivalent. This would be more convenient if
    // the hit window size is to be considered as well.

    // Note: The star rating is tuned extremely tight! Airman (/b/104229) and Freedom Dive (/b/126645), two of the hardest ranked maps, both score ~4.66 stars.
    // Expect the easier kind of maps that officially get 5 stars to obtain around 2 by this metric. The tutorial still scores about half a star.
    // Tune by yourself as you please. ;)

    return {
      aimStars, speedStars, starRating
    };
  }
}

export default DifficultyCalculator20140722;
