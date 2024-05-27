import anime from "animejs";

function createParticle(ctx, x, y, color) {
    var p = {};
    p.x = x;
    p.y = y;
    p.color = color;
    p.radius = anime.random(16, 32);
    p.alpha = anime.random(0.7, 1);
    p.endPos = setParticleDirection(p);
    p.draw = function () {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
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
function setParticleDirection(p) {
    var angle = (anime.random(0, 360) * Math.PI) / 180;
    var value = anime.random(50, 180);
    var radius = [-1, 1][anime.random(0, 1)] * value;
    return {
        x: p.x + radius * Math.cos(angle),
        y: p.y + radius * Math.sin(angle),
    };
}

export function animateParticles(ctx, x, y, nParticles, color) {
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
