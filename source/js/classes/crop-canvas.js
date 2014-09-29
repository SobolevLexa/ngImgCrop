'use strict';

crop.factory('cropCanvas', [function () {
    // Shape = Array of [x,y]; [0, 0] - center
    var shapeArrowNW = [[-0.5, -2], [-3, -4.5], [-0.5, -7], [-7, -7], [-7, -0.5], [-4.5, -3], [-2, -0.5]];
    var shapeArrowNE = [[0.5, -2], [3, -4.5], [0.5, -7], [7, -7], [7, -0.5], [4.5, -3], [2, -0.5]];
    var shapeArrowSW = [[-0.5, 2], [-3, 4.5], [-0.5, 7], [-7, 7], [-7, 0.5], [-4.5, 3], [-2, 0.5]];
    var shapeArrowSE = [[0.5, 2], [3, 4.5], [0.5, 7], [7, 7], [7, 0.5], [4.5, 3], [2, 0.5]];
    var shapeArrowN = [[-1.5, -2.5], [-1.5, -6], [-5, -6], [0, -11], [5, -6], [1.5, -6], [1.5, -2.5]];
    var shapeArrowW = [[-2.5, -1.5], [-6, -1.5], [-6, -5], [-11, 0], [-6, 5], [-6, 1.5], [-2.5, 1.5]];
    var shapeArrowS = [[-1.5, 2.5], [-1.5, 6], [-5, 6], [0, 11], [5, 6], [1.5, 6], [1.5, 2.5]];
    var shapeArrowE = [[2.5, -1.5], [6, -1.5], [6, -5], [11, 0], [6, 5], [6, 1.5], [2.5, 1.5]];

    // Colors
    var colors = {
        areaOutline: '#fff',
        resizeBoxStroke: '#fff',
        resizeBoxFill: '#444',
        resizeBoxArrowFill: '#fff',
        resizeCircleStroke: '#fff',
        resizeCircleFill: '#444',
        moveIconFill: '#fff'
    };

    return function (ctx) {

        /* Base functions */

        // Calculate Point
        var calcPoint = function (point, offset, scale) {
            return [scale * point[0] + offset[0], scale * point[1] + offset[1]];
        };
        /**
         * Detect subsampling in loaded image.
         * In iOS, larger images than 2M pixels may be subsampled in rendering.
         */
        var detectSubsampling = function (img) {
            if (img !== null) {
                var iw = img.naturalWidth, ih = img.naturalHeight;
                if (iw * ih > 1024 * 1024) { // subsampling may happen over megapixel image
                    var canvas = document.createElement('canvas');
                    canvas.width = canvas.height = 1;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, -iw + 1, 0);
                    // subsampled image becomes half smaller in rendering size.
                    // check alpha channel value to confirm image is covering edge pixel or not.
                    // if alpha value is 0 image is not covering, hence subsampled.
                    return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
                } else {
                    return false;
                }
            }
            return false;
        };

        /**
         * Detecting vertical squash in loaded image.
         * Fixes a bug which squash image vertically while drawing into canvas for some images.
         */
        var detectVerticalSquash = function (img, iw, ih) {
            if(img!== null) {
                var canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = ih;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                var data = ctx.getImageData(0, 0, 1, ih).data;
                // search image edge pixel position in case it is squashed vertically.
                var sy = 0;
                var ey = ih;
                var py = ih;
                while (py > sy) {
                    var alpha = data[(py - 1) * 4 + 3];
                    if (alpha === 0) {
                        ey = py;
                    } else {
                        sy = py;
                    }
                    py = (ey + sy) >> 1;
                }
                var ratio = (py / ih);
                return (ratio === 0) ? 1 : ratio;
            }
            return 1;
        };

        // Draw Filled Polygon
        var drawFilledPolygon = function (shape, fillStyle, centerCoords, scale) {
            ctx.save();
            ctx.fillStyle = fillStyle;
            ctx.beginPath();
            var pc, pc0 = calcPoint(shape[0], centerCoords, scale);
            ctx.moveTo(pc0[0], pc0[1]);

            for (var p in shape) {
                if (p > 0) {
                    pc = calcPoint(shape[p], centerCoords, scale);
                    ctx.lineTo(pc[0], pc[1]);
                }
            }

            ctx.lineTo(pc0[0], pc0[1]);
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        };


        /* Icons */

        this.drawIconMove = function (centerCoords, scale) {
            drawFilledPolygon(shapeArrowN, colors.moveIconFill, centerCoords, scale);
            drawFilledPolygon(shapeArrowW, colors.moveIconFill, centerCoords, scale);
            drawFilledPolygon(shapeArrowS, colors.moveIconFill, centerCoords, scale);
            drawFilledPolygon(shapeArrowE, colors.moveIconFill, centerCoords, scale);
        };

        this.drawIconResizeCircle = function (centerCoords, circleRadius, scale) {
            var scaledCircleRadius = circleRadius * scale;
            ctx.save();
            ctx.strokeStyle = colors.resizeCircleStroke;
            ctx.lineWidth = 2;
            ctx.fillStyle = colors.resizeCircleFill;
            ctx.beginPath();
            ctx.arc(centerCoords[0], centerCoords[1], scaledCircleRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
        };

        this.drawIconResizeBoxBase = function (centerCoords, boxSize, scale) {
            var scaledBoxSize = boxSize * scale;
            ctx.save();
            ctx.strokeStyle = colors.resizeBoxStroke;
            ctx.lineWidth = 2;
            ctx.fillStyle = colors.resizeBoxFill;
            ctx.fillRect(centerCoords[0] - scaledBoxSize / 2, centerCoords[1] - scaledBoxSize / 2, scaledBoxSize, scaledBoxSize);
            ctx.strokeRect(centerCoords[0] - scaledBoxSize / 2, centerCoords[1] - scaledBoxSize / 2, scaledBoxSize, scaledBoxSize);
            ctx.restore();
        };
        this.drawIconResizeBoxNESW = function (centerCoords, boxSize, scale) {
            this.drawIconResizeBoxBase(centerCoords, boxSize, scale);
            drawFilledPolygon(shapeArrowNE, colors.resizeBoxArrowFill, centerCoords, scale);
            drawFilledPolygon(shapeArrowSW, colors.resizeBoxArrowFill, centerCoords, scale);
        };
        this.drawIconResizeBoxNWSE = function (centerCoords, boxSize, scale) {
            this.drawIconResizeBoxBase(centerCoords, boxSize, scale);
            drawFilledPolygon(shapeArrowNW, colors.resizeBoxArrowFill, centerCoords, scale);
            drawFilledPolygon(shapeArrowSE, colors.resizeBoxArrowFill, centerCoords, scale);
        };

        /* Crop Area */

        this.drawCropArea = function (image, center, size, fnDrawClipPath) {
            var iw = image.naturalWidth, ih = image.naturalHeight,
                subsampled = detectSubsampling(image);
            if (subsampled) {
                iw /= 2;
                ih /= 2;
            }
            var vertSquashRatio = detectVerticalSquash(image, iw, ih),
                xRatio = iw / ctx.canvas.width,
                yRatio = ih / ctx.canvas.height,
                xLeft = size.x,
                yTop = size.y;

            ctx.save();
            ctx.strokeStyle = colors.areaOutline;
            ctx.lineWidth = 2;
            ctx.beginPath();
            fnDrawClipPath(ctx, center, size);
            ctx.stroke();
            ctx.clip();

            // draw part of original image
            if (size.w > 0 && size.w > 0) {
                ctx.drawImage(image,
                    xLeft * xRatio * vertSquashRatio,
                    yTop * yRatio * vertSquashRatio,
                    size.w * xRatio * vertSquashRatio,
                    size.h * yRatio * vertSquashRatio,
                    xLeft, yTop, size.w, size.h);
            }

            ctx.beginPath();
            fnDrawClipPath(ctx, center, size);
            ctx.stroke();
            ctx.clip();

            ctx.restore();
        };

    };
}]);
