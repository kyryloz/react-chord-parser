﻿// Based on chord.js v1.0.0 | MIT | Einar Egilsson 2015 | http://einaregilsson.com
// re-implemented as React component by Kyrylo Zapylaiev <zak@robotnec.com>

import * as React from "react";

const sizes = {
    cellWidth: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
    nutSize: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    lineWidth: [1, 1, 1, 1, 1, 1, 2, 2, 2, 2],
    barWidth: [2.5, 3, 5, 7, 7, 9, 10, 10, 12, 12],
    dotRadius: [2, 2.8, 3.7, 4.5, 5.3, 6.5, 7, 8, 9, 10],
    openStringRadius: [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6.5],
    openStringLineWidth: [1, 1.2, 1.2, 1.4, 1.4, 1.4, 1.6, 2, 2, 2],
    muteStringRadius: [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5],
    muteStringLineWidth: [1.05, 1.1, 1.1, 1.2, 1.5, 1.5, 1.5, 2, 2.4, 2.5],
    nameFontSize: [10, 14, 18, 22, 26, 32, 36, 40, 44, 48],
    nameFontPaddingBottom: [4, 4, 5, 4, 4, 4, 5, 5, 5, 5],
    fingerFontSize: [7, 8, 9, 11, 13, 14, 15, 18, 20, 22],
    fretFontSize: [6, 8, 10, 12, 14, 14, 16, 17, 18, 19]
};

export default class Chord extends React.Component {

    constructor(props) {
        super(props);
        this.MUTED = -1;

        this.renderers = {};
        this.renderers.canvas = {
            init: function (info, canvas) {
                var ctx = this.ctx = canvas;
                canvas.width = info.width;
                canvas.height = info.height;

                if (!this.inited && info.lineWidth % 2 == 1) {
                    ctx.translate(0.5, 0.5);
                }

                this.inited = true;

                ctx.fillStyle = 'white';
                ctx.fillRect(-1, -1, canvas.width + 2, canvas.height + 2);
                ctx.fillStyle = 'black';

                ctx.lineJoin = 'miter';
                ctx.lineWidth = info.lineWidth;
                ctx.lineCap = 'square';
                ctx.strokeStyle = 'black';
            },

            line: function (x1, y1, x2, y2, width, cap) {
                var c = this.ctx;
                c.save();
                if (width) {
                    c.lineWidth = width;
                }
                c.lineCap = cap || 'square';
                c.beginPath();
                c.moveTo(x1, y1);
                c.lineTo(x2, y2);
                c.stroke();
                c.restore();
            },

            text: function (x, y, text, font, size, baseline, align) {
                this.ctx.font = size + 'px ' + font;
                this.ctx.textBaseline = baseline;
                this.ctx.textAlign = align;
                this.ctx.fillText(text, x, y)
            },

            rect: function (x, y, width, height, lineWidth) {
                this.ctx.fillRect(x - lineWidth / 2.0, y - lineWidth / 2.0, width + lineWidth, height + lineWidth);
            },

            circle: function (x, y, radius, fillCircle, lineWidth) {
                var c = this.ctx;
                c.beginPath();
                c.arc(x, y, radius, 2 * Math.PI, false)
                if (fillCircle) {
                    c.fill();
                } else {
                    c.lineWidth = lineWidth;
                    c.stroke();
                }
            },
        };

        this.renderChord = function () {
            const chordName = this.props.name;

            this.initDraw(chordName, this.props.diagram, "");
            this.renderer = this.renderers.canvas; //Could potentially put in different renderers here, SVG, url etc.
            this.draw(4);
        };
    }

    initDraw(name, positions, fingers) {
        this.parse(positions, fingers);
        this.name = name;
        this.rawPositions = positions;
        this.rawFingers = fingers || '';
    }

    parse(frets, fingers) {
        this.positions = [];
        var raw = [];
        if (frets.match(/^[0-9xX]{1,6}$/)) {
            for (var i = 0; i < frets.length; i++) {
                raw.push(frets.charAt(i));
            }
        } else {
            raw = frets.split(/[^\dxX]/);
        }
        this.stringCount = raw.length;
        if (this.stringCount == 4) {
            this.fretCount = 4;
        } else {
            this.fretCount = 5;
        }
        var maxFret = 0;
        var minFret = 1000;

        for (var i in raw) {
            var c = raw[i];
            if (c.toLowerCase() == 'x') {
                this.positions.push(Chord.MUTED);
            } else {
                var fret = parseInt(c);
                if (fret > 0 && fret < minFret) {
                    minFret = fret;
                }
                maxFret = Math.max(maxFret, fret);
                this.positions.push(fret);
            }
        }
        if (maxFret <= this.fretCount) {
            this.startFret = 1;
        } else {
            this.startFret = minFret;
        }
        this.fingerings = [];
        if (!fingers) {
            return;
        }
        var j = 0;
        for (var i = 0; i < fingers.length; i++) {
            for (; j < this.positions.length; j++) {
                if (this.positions[j] <= 0) {
                    this.fingerings.push(null);
                } else {
                    this.fingerings.push(fingers[i]);
                    j++;
                    break;
                }
            }
        }
    }

    drawMutedAndOpenStrings(info) {
        var r = this.renderer;
        for (var i in this.positions) {
            var pos = this.positions[i];
            var x = info.boxStartX + i * info.cellWidth;
            var y = info.nameFontSize + info.nameFontPaddingBottom + info.dotRadius - 2;
            if (this.startFret > 1) {
                y += info.nutSize;
            }
            if (pos == Chord.MUTED) {
                this.drawCross(info, x, y, info.muteStringRadius, info.muteStringLineWidth);
            } else if (pos == 0) {
                r.circle(x, y, info.openStringRadius, false, info.openStringLineWidth);
            }
        }
    }

    drawPositions(info) {
        var r = this.renderer;
        for (var i in this.positions) {
            var pos = this.positions[i];
            if (pos > 0) {
                var relativePos = pos - this.startFret + 1;
                var x = info.boxStartX + i * info.cellWidth;
                if (relativePos <= 5) {
                    var y = info.boxStartY + relativePos * info.cellHeight - (info.cellHeight / 2)
                    r.circle(x, y, info.dotRadius, true);
                }
            }
        }
    }

    drawFretGrid(info) {
        var r = this.renderer;
        var width = (this.stringCount - 1) * info.cellWidth;
        for (var i = 0; i <= this.stringCount - 1; i++) {
            var x = info.boxStartX + i * info.cellWidth;
            r.line(x, info.boxStartY, x, info.boxStartY + this.fretCount * info.cellHeight, info.lineWidth, 'square');
        }

        for (var i = 0; i <= this.fretCount; i++) {
            var y = info.boxStartY + i * info.cellHeight;
            r.line(info.boxStartX, y, info.boxStartX + width, y, info.lineWidth, 'square');
        }
    }

    drawNut(info) {
        var r = this.renderer;
        if (this.startFret == 1) {
            r.rect(info.boxStartX, info.boxStartY - info.nutSize, info.boxWidth, info.nutSize, info.lineWidth);
        } else {
            r.text(info.boxStartX - info.dotRadius, info.boxStartY + info.cellHeight / 2.0, this.startFret + '', info.font, info.fretFontSize, 'middle', 'right');
        }
    }

    drawName(info) {
        var r = this.renderer;
        r.text(info.width / 2.0, info.nameFontSize + info.lineWidth * 3, this.name, info.font, info.nameFontSize, 'bottom', 'center');
    }

    calculateDimensions(scale) {
        var info = {};
        scale--;
        for (var name in sizes) {
            info[name] = sizes[name][scale];
        }

        info.scale = scale;
        info.positions = this.rawPositions;
        info.fingers = this.rawFingers;
        info.name = this.name;
        info.cellHeight = info.cellWidth;
        info.dotWidth = 2 * info.dotRadius;
        info.font = 'Arial';
        info.boxWidth = (this.stringCount - 1) * info.cellWidth;
        info.boxHeight = (this.fretCount) * info.cellHeight;
        info.width = info.boxWidth + 4 * info.cellWidth;
        info.height = info.nameFontSize + info.nameFontPaddingBottom + info.dotWidth + info.nutSize + info.boxHeight + info.fingerFontSize + 4;
        info.boxStartX = Math.round(((info.width - info.boxWidth) / 2));
        info.boxStartY = Math.round(info.nameFontSize + info.nameFontPaddingBottom + info.nutSize + info.dotWidth);
        return info;
    }

    draw(scale) {
        const info = this.calculateDimensions(scale);
        this.renderer.init(info, this.refs.canvas.getContext('2d'));
        this.drawFretGrid(info);
        this.drawNut(info);
        this.drawName(info);
        this.drawMutedAndOpenStrings(info);
        this.drawPositions(info);
        this.drawFingerings(info);
        this.drawBars(info);
    }

    drawBars(info) {
        var r = this.renderer;
        if (this.fingerings.length > 0) {
            var bars = {};
            for (var i = 0; i < this.positions.length; i++) {
                var fret = this.positions[i];
                if (fret > 0) {
                    if (bars[fret] && bars[fret].finger == this.fingerings[i]) {
                        bars[fret].length = i - bars[fret].index;
                    } else {
                        bars[fret] = {finger: this.fingerings[i], length: 0, index: i};
                    }
                }
            }
            for (var fret in bars) {
                if (bars[fret].length > 0) {
                    var xStart = info.boxStartX + bars[fret].index * info.cellWidth;
                    var xEnd = xStart + bars[fret].length * info.cellWidth;
                    var relativePos = fret - this.startFret + 1;
                    var y = info.boxStartY + relativePos * info.cellHeight - (info.cellHeight / 2);
                    //console.log('y: ' + y + ', barWidth: ' + info.barWidth);
                    r.line(xStart, y, xEnd, y, info.barWidth, 'square');
                }
            }

            //Explicit, calculate from that
        } else {
            //Try to guesstimate whether there is a bar or not
            var barFret = this.positions[this.positions.length - 1];
            if (barFret <= 0) {
                return;
            }
            if (this.positions.join('') == '-1-10232') { //Special case for the D chord...
                return;
            }
            var startIndex = -1;

            for (var i = 0; i < this.positions.length - 2; i++) {
                var fret = this.positions[i];
                if (fret > 0 && fret < barFret) {
                    return;
                } else if (fret == barFret && startIndex == -1) {
                    startIndex = i;
                } else if (startIndex != -1 && fret < barFret) {
                    return;
                }
            }
            if (startIndex >= 0) {
                var xStart = info.boxStartX + startIndex * info.cellWidth;
                var xEnd = (this.positions.length - 1) * info.cellWidth;
                var relativePos = barFret - this.startFret + 1;
                var y = info.boxStartY + relativePos * info.cellHeight - (info.cellHeight / 2);
                r.line(xStart, y, xEnd, y, info.dotRadius, 'square');
            }
        }
    }

    drawCross(info, x, y, radius, lineWidth) {
        var r = this.renderer;
        var angle = Math.PI / 4;
        for (var i = 0; i < 2; i++) {
            var startAngle = angle + i * Math.PI / 2;
            var endAngle = startAngle + Math.PI;

            var startX = x + radius * Math.cos(startAngle);
            var startY = y + radius * Math.sin(startAngle);
            var endX = x + radius * Math.cos(endAngle);
            var endY = y + radius * Math.sin(endAngle);

            r.line(startX, startY, endX, endY, lineWidth, 'round');
        }
    }

    drawFingerings(info) {
        var r = this.renderer;
        var fontSize = info.fingerFontSize;
        for (var i in this.fingerings) {
            var finger = this.fingerings[i];
            var x = info.boxStartX + i * info.cellWidth;
            var y = info.boxStartY + info.boxHeight + fontSize + info.lineWidth + 1;
            if (finger) {
                r.text(x, y, finger, info.font, fontSize, 'bottom', 'center');
            }
        }
    }

    componentDidMount() {
        this.renderChord();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.name !== nextProps.name || this.props.diagram !== nextProps.diagram) {
            this.props = nextProps;
            this.renderChord();
        }
    }

﻿    render() {
        return (
            <div style={this.props.style}>
                <canvas ref="canvas"/>
            </div>
        )
    }
}
