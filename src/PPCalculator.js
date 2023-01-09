import PPCalculator20140127 from "./20140127/PPCalculator.js";
import PPCalculator20140209 from "./20140209/PPCalculator.js";
import PPCalculator20140228 from "./20140228/PPCalculator.js";
import PPCalculator20140303 from "./20140303/PPCalculator.js";
import PPCalculator20140511 from "./20140511/PPCalculator.js";
import PPCalculator20140609 from "./20140609/PPCalculator.js";
import PPCalculator20140629 from "./20140629/PPCalculator.js";
import PPCalculator20140722 from "./20140722/PPCalculator.js";
import PPCalculator20150210 from "./20150210/PPCalculator.js";
import PPCalculator20150212 from "./20150212/PPCalculator.js";
import PPCalculator20150216 from "./20150216/PPCalculator.js";
import PPCalculator20150404 from "./20150404/PPCalculator.js";

class PPCalculator {
    static create(d) {
        const date = new Date(d);
        const dateRange = [
            {
                start: new Date("2014-01-27"),
                end: new Date("2014-02-09"),
                calculator: PPCalculator20140127
            },
            {
                start: new Date("2014-02-09"),
                end: new Date("2014-02-28"),
                calculator: PPCalculator20140209
            },
            {
                start: new Date("2014-02-28"),
                end: new Date("2014-03-03"),
                calculator: PPCalculator20140228
            },
            {
                start: new Date("2014-03-03"),
                end: new Date("2014-05-11"),
                calculator: PPCalculator20140303
            },
            {
                start: new Date("2014-05-11"),
                end: new Date("2014-06-09"),
                calculator: PPCalculator20140511
            },
            {
                start: new Date("2014-06-09"),
                end: new Date("2014-06-29"),
                calculator: PPCalculator20140609
            },
            {
                start: new Date("2014-06-29"),
                end: new Date("2014-07-22"),
                calculator: PPCalculator20140629
            },
            {
                start: new Date("2014-07-22"),
                end: new Date("2015-02-10"),
                calculator: PPCalculator20140722
            },
            {
                start: new Date("2015-02-10"),
                end: new Date("2015-02-12"),
                calculator: PPCalculator20150210
            },
            {
                start: new Date("2015-02-12"),
                end: new Date("2015-02-16"),
                calculator: PPCalculator20150212
            },
            {
                start: new Date("2015-02-16"),
                end: new Date("2015-04-04"),
                calculator: PPCalculator20150216
            },
            {
                start: new Date("2015-04-04"),
                end: new Date("2018-05-16"),
                calculator: PPCalculator20150404
            }
        ];
        let ppCalculator;
        dateRange.forEach(range => {
            if (date >= range.start && date < range.end) {
                ppCalculator = range.calculator;
            }
        });
        if (ppCalculator) {
            return new ppCalculator();
        } else if (date < dateRange[0].start) {
            throw new Error("ppv1 not implemented.");
        } else {
            throw new Error("No pp calculator found for this date.");
        }
    }
}

export default PPCalculator;