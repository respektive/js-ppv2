import MODS_ENUM from "../Mods.js";
import DifficultyCalculator20140609 from "./DifficultyCalculator.js";

class PPCalculator20140609 {
    accuracyCalc = (c300, c100, c50, misses) => {
        const totalHits = c300 + c100 + c50 + misses;
        let accuracy = 0.0;
        if (totalHits > 0) {
            accuracy = (
            c50 * 50.0 + c100 * 100.0 + c300 * 300.0) /
            (totalHits * 300.0);
        }
        return accuracy;
    };

    calc100Count = (accuracy, totalHits, misses) => Math.round(-3 / 2 * ((accuracy - 1) * totalHits + misses));

    calculate(beatmap, accuracyPercent = 100, mods = MODS_ENUM.None, combo = -1, misses = 0) {

        beatmap.applyMods(mods);
        const diff = new DifficultyCalculator20140609().calculate(beatmap);
        const hitObjectCount = beatmap.hitObjects.length;

        // cap misses to num objects
        misses = Math.min(hitObjectCount, misses);

        // cap acc to max acc with the given amount of misses
        const max300 = hitObjectCount - misses;

        accuracyPercent = Math.max(0.0,
            Math.min(this.accuracyCalc(max300, 0, 0, misses) * 100.0, accuracyPercent));

        // round acc to the closest amount of 100s or 50s
        let c50 = 0;
        let c100 = Math.round(-3.0 * ((accuracyPercent * 0.01 - 1.0) *
            hitObjectCount + misses) * 0.5);

        if (c100 > hitObjectCount - misses) {
            // acc lower than all 100s, use 50s
            c100 = 0;
            c50 = Math.round(-6.0 * ((accuracyPercent * 0.01 - 1.0) *
            hitObjectCount + misses) * 0.2);

            c50 = Math.min(max300, c50);
        } else {
            c100 = Math.min(max300, c100);
        }

        let c300 = hitObjectCount - c100 - c50 - misses;

        return this.calculateWithCounts(diff, beatmap, mods, combo, misses, c300, c100, 0);
    }

    calculateWithCounts(diff, beatmap, mods = MODS_ENUM.None, combo = -1, misses = 0, c300 = -1, c100 = 0, c50 = 0) {
        const aim = diff.aimStars
        const speed = diff.speedStars

        if (!beatmap.combo)
            throw new Error("Max combo cannot be zero");

        let overallDifficulty = beatmap.overallDifficulty;
        let approachRate = beatmap.approachRate;
        let circles = beatmap.circleCount;

        if (c300 <= 0)
            c300 = beatmap.hitObjects.length - c100 - c50 - misses;

        combo = combo <= 0 ? beatmap.combo : combo;

        const totalHits = c300 + c100 + c50 + misses;

        // accuracy (not in percentage, ranges between 0 and 1)
        const accuracy = this.accuracyCalc(c300, c100, c50, misses);

        // Calculate Aim Value
        // -------------------
        let aimValue = Math.pow(5.0 * Math.max(1.0, aim / 0.06675) - 4.0, 3.0) / 100000;

        // Longer maps are worth more
	    aimValue *= 1 + 0.1 * Math.min(1.0, totalHits / 1500.0);

        // Penalize misses exponentially. This mainly fixes tag4 maps and the likes until a per-hitobject solution is available
        aimValue *= Math.pow(0.97, misses);

        // Combo scaling
        if(beatmap.combo > 0) {
            aimValue *= Math.min(Math.pow(combo / beatmap.combo, 0.8), 1.0);
        }

        let approachRateFactor = 1.0;

        if(approachRate > 10.0) {
            approachRateFactor += 0.30 * (approachRate - 10.0);
        } else if(approachRate < 8.0) {
            // HD is worth more with lower ar!
            if(mods & MODS_ENUM.Hidden) {
                approachRateFactor += 0.02 * (8.0 - approachRate);
            } else {
                approachRateFactor += 0.01 * (8.0 - approachRate);
            }
        }
        
        aimValue *= approachRateFactor;

        if(mods & MODS_ENUM.Hidden)
        {
            aimValue *= 1.18;
        }
    
        if(mods & MODS_ENUM.Flashlight)
        {
            aimValue *= 1.50;
        }

        // Scale the aim value with accuracy _slightly_
        aimValue *= 0.5 + accuracy / 2.0;

        // It is important to also consider accuracy difficulty when doing that
        aimValue *= 0.98 + (Math.pow(overallDifficulty, 2) / 2500);

        // Calculate Speed Value
        // ---------------------
        let speedValue = Math.pow(5.0 * Math.max(1.0, speed / 0.0675) - 4.0, 3.0) / 100000;

        // Longer maps are worth more
        speedValue *= 1 + 0.1 * Math.min(1.0, totalHits / 1500.0);

        // Penalize misses exponentially. This mainly fixes tag4 maps and the likes until a per-hitobject solution is available
        speedValue *= Math.pow(0.97, misses);

        // Combo scaling
        if(beatmap.combo > 0)
        {
            speedValue *= Math.min(Math.pow(combo / beatmap.combo, 0.8), 1.0);
        }

        // Scale the speed value with accuracy _slightly_
	    speedValue *= 0.5 + accuracy / 2.0;

        // It is important to also consider accuracy difficulty when doing that
	    speedValue *= 0.98 + (Math.pow(overallDifficulty , 2) / 2500);

        // Calculate Acc Value
        // -------------------

        // This percentage only considers HitCircles of any value - in this part of the calculation we focus on hitting the timing hit window
        let betterAccuracyPercentage = 0.0;

        if (circles) {
            betterAccuracyPercentage = ((c300 - (totalHits - circles)) * 6 + c100 * 2 + c50) / (circles * 6);
        }

        // It is possible to reach a negative accuracy with this formula. Cap it at zero - zero points
        betterAccuracyPercentage = Math.max(0.0, betterAccuracyPercentage);

        // Lots of arbitrary values from testing.
        // Considering to use derivation from perfect accuracy in a probabilistic manner - assume normal distribution
        let accValue = Math.pow(1.52163, overallDifficulty) * Math.pow(betterAccuracyPercentage, 24) * 2.738;

        // Bonus for many hitcircles - it's harder to keep good accuracy up for longer
	    accValue *= Math.min(1.15, Math.pow(circles / 1000.0, 0.3));

        if(mods & MODS_ENUM.Hidden)
        {
            accValue *= 1.02;
        }
    
        if(mods & MODS_ENUM.Flashlight)
        {
            accValue *= 1.02;
        }

        // Compute Total Value
        // -------------------

        // Custom multipliers for NoFail and SpunOut.
	    let finalMultiplier = 1.1; // This is being adjusted to keep the final pp value scaled around what it used to be when changing things
        
        if(mods & MODS_ENUM.NoFail)
        {
            finalMultiplier *= 0.90;
        }
    
        if(mods & MODS_ENUM.SpunOut)
        {
            finalMultiplier *= 0.95;
        }

        const totalValue = Math.pow(
            Math.pow(aimValue, 1.1) +
            Math.pow(speedValue, 1.1) +
            Math.pow(accValue, 1.1),
            1.0 / 1.1
        ) * finalMultiplier;

        return {
            diff: diff,
            pp: {
                aim: aimValue,
                speed: speedValue,
                acc: accValue,
                total: totalValue
            },
            accuracy: accuracy * 100
        };
    }
}

export default PPCalculator20140609