export default class Parser {

    constructor(input) {
        this.input = input;
        this.regex = /((\\)?\b[A-G](?:(?:add|dim|aug|maj|mM|mMaj|sus|m|b|#|\d)?(?:\/[A-G0-9])?)*(?!\||—|-|\.|:)(?:\b|#)+)/g;
    }

    all() {
        let matches = this.input.match(this.regex);

        if (!matches) {
            return [];
        }

        matches = matches.filter(match => !match.startsWith("\\"));

        return matches.sort((a, b) => {
            a = a.toLowerCase();
            b = b.toLowerCase();
            return a > b ? 1 : a < b ? -1 : 0;
        });
    }

    unique() {
        return this.all().filter((chord, index, arr) => arr.indexOf(chord) === index);
    }

    wrap(callback) {
        return this.input.replace(this.regex, match => {
            if (match.startsWith("\\")) {
                return match.replace("\\", "");
            } else {
                return callback(match);
            }
        });
    }
}
