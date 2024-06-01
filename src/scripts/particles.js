import anime from "animejs";

function createParticle(ctx, x, y, color, maxAngle = 360, yOffset = 0) {
    var p = {};
    p.x = x;
    p.y = y + anime.random(0, yOffset);
    p.color = color;
    p.radius = anime.random(8, 20);
    p.alpha = anime.random(0.7, 1);
    p.endPos = setParticleDirection(p, maxAngle);
    p.draw = function () {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
    };
    return p;
}
function strokeStar(ctx, x, y, r, n, inset, color, alpha, rotation = 0) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.moveTo(0, 0 - r);
    ctx.rotate((rotation * Math.PI) / 180);
    for (var i = 0; i < n; i++) {
        ctx.rotate(Math.PI / n);
        ctx.lineTo(0, 0 - r * inset);
        ctx.rotate(Math.PI / n);
        ctx.lineTo(0, 0 - r);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.restore();
}
function createStarParticle(ctx, x, y, color) {
    var p = {};
    p.x = x;
    p.y = y + anime.random(0, 15);
    p.color = color;
    p.radius = anime.random(16, 32);
    p.rotation = 45;
    p.alpha = anime.random(0.8, 1);
    p.endPos = setParticleDirection(p, 0, 90, 130);
    p.draw = function () {
        strokeStar(ctx, p.x, p.y, p.radius, 4, 0.5, color, p.alpha, p.rotation);
    };
    return p;
}
function createCircle(ctx, x, y) {
    var p = {};
    p.x = x;
    p.y = y;
    p.color = "#FFF";
    p.radius = 0.1;
    p.alpha = 0.5;
    p.lineWidth = 6;
    p.draw = function () {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
        ctx.lineWidth = p.lineWidth;
        ctx.strokeStyle = p.color;
        ctx.stroke();
        ctx.globalAlpha = 1;
    };
    return p;
}
function renderParticle(anim) {
    for (var i = 0; i < anim.animatables.length; i++) {
        anim.animatables[i].target.draw();
    }
}
function setParticleDirection(p, maxAngle, rMin = 30, rMax = 100) {
    var angle = (anime.random(0, maxAngle) * Math.PI) / 180;
    var value = anime.random(rMin, rMax);
    var radius = [-1, 1][anime.random(0, 1)] * value;
    return {
        x: p.x + radius * Math.cos(angle),
        y: p.y + radius * Math.sin(angle),
    };
}

export function animateFallParticles(ctx, x, y, nParticles, color) {
    var circle = createCircle(ctx, x, y);
    var particles = [];
    for (var i = 0; i < nParticles; i++) {
        particles.push(createParticle(ctx, x, y, color));
    }
    anime
        .timeline()
        .add({
            targets: particles,
            x: function (p) {
                return p.endPos.x;
            },
            y: function (p) {
                return p.endPos.y;
            },
            radius: 0.1,
            duration: anime.random(1000, 1500),
            easing: "easeOutExpo",
            update: renderParticle,
        })
        .add(
            {
                targets: circle,
                radius: anime.random(80, 160),
                lineWidth: 0,
                alpha: {
                    value: 0,
                    easing: "linear",
                    duration: anime.random(600, 800),
                },
                duration: anime.random(1200, 1800),
                easing: "easeOutExpo",
                update: renderParticle,
            },
            0,
        );
}

export function animateLineClearParticles(ctx, x, y, nParticles, color) {
    var particles = [];
    for (var i = 0; i < nParticles; i++) {
        particles.push(createStarParticle(ctx, x, y, color));
    }
    anime.timeline().add({
        targets: particles,
        x: function (p) {
            return p.endPos.x;
        },
        y: function (p) {
            return p.endPos.y;
        },
        radius: 0.1,
        duration: anime.random(300, 500),
        easing: "easeOutCubic",
        update: renderParticle,
    });
}
