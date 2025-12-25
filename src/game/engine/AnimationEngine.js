export class AnimationEngine {
    constructor(scene) {
        this.scene = scene;
    }

    moveToTile(sprite, tile, tileSize, duration = 200) {
        if (!sprite) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: sprite,
                x: tile.x * tileSize + tileSize / 2,
                y: tile.y * tileSize + tileSize / 2,
                duration: duration,
                ease: 'Power2', // 부드러운 감속 효과
                onComplete: resolve
            });
        });
    }

    async moveAlongPath(sprite, path, tileSize, stepDuration = 150) {
        if (!sprite || !path || path.length === 0) {
            return;
        }

        // 1. 현재 스프라이트의 위치를 타일 좌표로 변환 (시작점)
        const startX = Math.floor(sprite.x / tileSize);
        const startY = Math.floor(sprite.y / tileSize);
        const startPoint = { x: startX, y: startY };

        // 2. 시작점을 포함한 전체 경로 구성
        const fullPath = [startPoint, ...path];

        // 3. 경로 압축 (대각선 최적화)
        // "가로 1칸 + 세로 1칸" 이동이 연속되면 -> "대각선 1칸"으로 합침
        const optimizedPath = this.optimizePathForDiagonals(fullPath);

        // 4. 압축된 경로를 따라 트윈(Tween) 애니메이션 실행
        // (첫 번째 점은 현재 위치이므로 제외하고 두 번째 점부터 이동)
        for (let i = 1; i < optimizedPath.length; i++) {
            const target = optimizedPath[i];
            
            // 대각선 이동일 경우(거리가 1보다 큼), 시간을 조금 더 줘서 자연스럽게 함
            // (직각 이동 2번 시간보다는 짧게, 1번 시간보다는 조금 길게)
            const isDiagonal = Math.abs(target.x - optimizedPath[i-1].x) > 0 && 
                               Math.abs(target.y - optimizedPath[i-1].y) > 0;
            const duration = isDiagonal ? stepDuration * 1.4 : stepDuration;

            await this.moveToTile(sprite, target, tileSize, duration);
        }
    }

    optimizePathForDiagonals(path) {
        if (path.length < 3) {
            return path;
        }

        const optimized = [path[0]];
        let i = 0;

        while (i < path.length - 1) {
            // 현재 지점(i), 다음 지점(i+1), 다다음 지점(i+2) 확인
            const current = path[i];
            const next = path[i + 1];
            
            // 다다음 지점이 없으면 그냥 다음 지점 추가하고 종료
            if (i + 2 >= path.length) {
                optimized.push(next);
                i++;
                continue;
            }

            const nextNext = path[i + 2];

            // 대각선 체크 로직
            const dx = Math.abs(nextNext.x - current.x);
            const dy = Math.abs(nextNext.y - current.y);

            // 만약 다다음 지점이 현재 지점에서 "가로1 + 세로1" 거리(즉, 대각선)에 있다면?
            if (dx === 1 && dy === 1) {
                // 중간 지점(next)을 건너뛰고 바로 nextNext로 이동!
                optimized.push(nextNext);
                i += 2; // 2칸 점프
            } else {
                // 대각선이 아니면 정직하게 다음 칸으로 이동
                optimized.push(next);
                i++;
            }
        }

        return optimized;
    }

    playAttackAnimation(attackerSprite, targetSprite, onHit) {
        if (!attackerSprite || !targetSprite) {
            if (onHit) onHit();
            return Promise.resolve();
        }

        const startX = attackerSprite.x;
        const startY = attackerSprite.y;

        // 타겟 방향으로 살짝 돌진했다가 돌아오는 애니메이션
        const angle = Phaser.Math.Angle.Between(startX, startY, targetSprite.x, targetSprite.y);
        const distance = 20; // 찌르는 거리
        const lungeX = startX + Math.cos(angle) * distance;
        const lungeY = startY + Math.sin(angle) * distance;

        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: attackerSprite,
                x: lungeX,
                y: lungeY,
                duration: 80,
                yoyo: true, // 갔다가 자동으로 돌아옴
                onYoyo: () => {
                    if (onHit) onHit(); // 타격 시점에 콜백 실행
                },
                onComplete: () => {
                    attackerSprite.x = startX; // 위치 보정
                    attackerSprite.y = startY;
                    resolve();
                }
            });
        });
    }

    tileToWorldPosition(tile, tileSize) {
        return {
            x: tile.x * tileSize + tileSize / 2,
            y: tile.y * tileSize + tileSize / 2
        };
    }
}
