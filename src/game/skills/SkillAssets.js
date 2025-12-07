const ASSET_PREFIX = 'assets/';

export function getSkillTextureKey(skillId) {
    if (!skillId) {
        return null;
    }
    return `skill-icon-${skillId}`;
}

export function getSkillTexturePath(iconPath) {
    if (!iconPath) {
        return null;
    }
    return iconPath.startsWith(ASSET_PREFIX) ? iconPath.slice(ASSET_PREFIX.length) : iconPath;
}

export function preloadSkillTextures(loader, skills = []) {
    if (!loader || typeof loader.image !== 'function') {
        return;
    }

    skills.forEach((skill) => {
        const key = getSkillTextureKey(skill?.id);
        const path = getSkillTexturePath(skill?.icon);
        if (key && path) {
            loader.image(key, path);
        }
    });
}
