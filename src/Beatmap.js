import Vec2 from './Vec2.js';
import MODS_ENUM from './Mods.js';

const OD_0_MS = 79.5;
const OD_10_MS = 19.5;
const AR_0_MS = 1800;
const AR_5_MS = 1200;
const AR_10_MS = 450;

const OD_MS_STEP = 6;
const AR_MS_STEP1 = 120;
const AR_MS_STEP2 = 150;

export const HitObjectType = [
    "Circle",
    "Spinner",
    "Slider",
];

export class HitObject {
    position;
    startTime;
    endTime;
    type;
};

export default class Beatmap {
    mode;
    hpDrainRate;
    circleSize;
    overallDifficulty;
    approachRate;
    sv;
    combo;
    tickRate;
    hitObjects;
    circleCount;
    sliderCount;
    spinnerCount;

    applyMods(mods) {
        if (!mods)
        return;

        // od
        let overallDifficultyMultiplier = 1;

        if (mods & MODS_ENUM.HardRock) {
        overallDifficultyMultiplier *= 1.4;
        }

        if (mods & MODS_ENUM.Easy) {
        overallDifficultyMultiplier *= 0.5;
        }

        this.overallDifficulty *= overallDifficultyMultiplier;
        let overallDifficultyMillis = OD_0_MS - Math.ceil(OD_MS_STEP * this.overallDifficulty);

        // ar
        let approachRateMultiplier = 1;

        if (mods & MODS_ENUM.HardRock) {
        approachRateMultiplier = 1.4;
        }

        if (mods & MODS_ENUM.Easy) {
        approachRateMultiplier = 0.5;
        }

        this.approachRate *= approachRateMultiplier;

        // convert AR into its milliseconds value
        let approachRateMillis = this.approachRate <= 5
        ? (AR_0_MS - AR_MS_STEP1 * this.approachRate)
        : (AR_5_MS - AR_MS_STEP2 * (this.approachRate - 5));

        // cs
        let circleSizeMultiplier = 1;

        if (mods & MODS_ENUM.HardRock) {
        circleSizeMultiplier = 1.3;
        }

        if (mods & MODS_ENUM.Easy) {
        circleSizeMultiplier = 0.5;
        }

        // stats must be capped to 0-10 before HT/DT which bring them to a range
        // of -4.42 to 11.08 for OD and -5 to 11 for AR
        overallDifficultyMillis = Math.min(OD_0_MS, Math.max(OD_10_MS, overallDifficultyMillis));
        approachRateMillis = Math.min(AR_0_MS, Math.max(AR_10_MS, approachRateMillis));

        // playback speed
        let speed = 1;

        if (mods & MODS_ENUM.DoubleTime) {
        speed *= 1.5;
        }

        if (mods & MODS_ENUM.HalfTime) {
        speed *= 0.75;
        }

        const invSpeed = 1 / speed;

        // apply speed-changing mods
        overallDifficultyMillis *= invSpeed;
        approachRateMillis *= invSpeed;

        // convert OD and AR back into their stat form
        this.overallDifficulty = (OD_0_MS - overallDifficultyMillis) / OD_MS_STEP;
        this.approachRate = this.approachRate <= 5.0
        ? ((AR_0_MS - approachRateMillis) / AR_MS_STEP1)
        : (5.0 + (AR_5_MS - approachRateMillis) / AR_MS_STEP2);

        this.circleSize *= circleSizeMultiplier;
        this.circleSize = Math.max(0.0, Math.min(10.0, this.circleSize));

        if (!(mods & MODS_ENUM.DoubleTime || mods & MODS_ENUM.HalfTime)) {
        // not speed-modifying
        return;
        }

        // apply speed-changing mods
        this.hitObjects.forEach(obj => {
        obj.startTime *= invSpeed;
        obj.endTime *= invSpeed;
        });
    }

    static fromOsuParserObject (obj) {
        let beatmap = new Beatmap;

        const types = {
        'slider': HitObjectType.Slider,
        'circle': HitObjectType.Circle,
        'spinner': HitObjectType.Spinner,
        };

        beatmap.hitObjects = obj.hitObjects.map((ho) => ({
        position: new Vec2(ho.position),
        startTime: ho.startTime,
        endTime: ho.endTime,
        type: types[ho.objectName],
        }));

        beatmap.mode = obj.Mode;

        beatmap.circleCount = obj.nbCircles
        beatmap.sliderCount = obj.nbSliders;
        beatmap.spinnerCount = obj.nbSpinners;

        beatmap.hpDrainRate = obj.HPDrainRate;
        beatmap.circleSize = obj.CircleSize;
        beatmap.overallDifficulty = obj.OverallDifficulty;
        beatmap.approachRate = obj.ApproachRate;

        beatmap.combo = obj.maxCombo;
        beatmap.tickRate = obj.SliderTickRate;

        return beatmap;
    }
}