"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePlayDescription = generatePlayDescription;
function generatePlayDescription(primary, action, defenseReaction, outcomeSuffix, points, shotType) {
    const name = primary.name;
    const actionText = mapActionToText(action, name, shotType);
    const defenseText = mapDefenseToText(defenseReaction, action);
    if (outcomeSuffix === 'GOOD') {
        const makeText = points === 3 ? `${shotType} pointer GOOD` : 'GOOD';
        return `${actionText}. ${defenseText}. ${makeText}.`;
    }
    if (outcomeSuffix === 'turnover') {
        return `${actionText}. ${defenseText}. Turnover.`;
    }
    if (outcomeSuffix === 'miss, offensive rebound') {
        return `${actionText}. ${defenseText}. Miss, offensive rebound.`;
    }
    return `${actionText}. ${defenseText}. Miss.`;
}
function mapActionToText(action, name, shotType) {
    switch (action) {
        case 'post-up':
            return `${name} posts up`;
        case 'drive':
            return `${name} drives`;
        case 'midrange-jumper':
            return `${name} pulls up from midrange`;
        case 'catch-and-shoot-three':
            return `${name} catches and shoots from three`;
        case 'isolation':
            return `${name} iso`;
        case 'pick-and-roll':
            return `${name} runs pick-and-roll`;
    }
}
function mapDefenseToText(reaction, action) {
    switch (reaction) {
        case 'double-team':
            return 'Double team arrives';
        case 'close-out':
            return 'Closeout comes late';
        case 'help-defense':
            return 'Help defense rotates';
        case 'switch':
            return 'Switch on the action';
        case 'drop':
            return 'Drop coverage';
        case 'stay-home':
            return 'Defense stays home';
    }
}
//# sourceMappingURL=playDescription.js.map