
export const AUTHORS = [
    {
        id: 'poet',
        name: '미치광이 시인',
        description: '혼돈과 불규칙성을 사랑하는 시인입니다. 그의 글은 좁고 구불구불한 길로 가득합니다.',
        style: {
            dungeon: {
                width: 60,
                height: 60,
                roomConfig: {
                    maxRooms: 20,
                    minWidth: 3,
                    maxWidth: 6,
                    minHeight: 3,
                    maxHeight: 6,
                    padding: 1
                },
                corridorWidth: 1
            },
            theme: 'dark'
        }
    },
    {
        id: 'tactician',
        name: '냉철한 전략가',
        description: '질서와 규율을 중시하는 전략가입니다. 그의 글은 넓고 시야가 확보된 전장을 묘사합니다.',
        style: {
            dungeon: {
                width: 50,
                height: 50,
                roomConfig: {
                    maxRooms: 8,
                    minWidth: 10,
                    maxWidth: 15,
                    minHeight: 10,
                    maxHeight: 15,
                    padding: 4
                },
                corridorWidth: 3
            },
            theme: 'military'
        }
    },
    {
        id: 'dreamer',
        name: '몽상가',
        description: '현실과 환상의 경계가 모호합니다. 거대하고 기이한 구조물이 나타납니다.',
        style: {
            dungeon: {
                width: 80,
                height: 80,
                roomConfig: {
                    maxRooms: 5,
                    minWidth: 15,
                    maxWidth: 25,
                    minHeight: 15,
                    maxHeight: 25,
                    padding: 2
                },
                corridorWidth: 2
            },
            theme: 'dream'
        }
    }
];

export class AuthorManager {
    constructor() {
        this.authors = new Map(AUTHORS.map(a => [a.id, a]));
    }

    getAuthors() {
        return AUTHORS;
    }

    getAuthor(id) {
        return this.authors.get(id);
    }

    writeBook(authorId) {
        const author = this.getAuthor(authorId);
        if (!author) return null;

        // Add some variance or randomization here if desired
        const variance = Math.floor(Math.random() * 5);

        const bookConfig = {
            ...author.style.dungeon,
            width: author.style.dungeon.width + variance,
            height: author.style.dungeon.height + variance,
            // Deep copy room config to avoid mutation
            roomConfig: { ...author.style.dungeon.roomConfig }
        };

        return {
            title: `${author.name}의 ${this.getRandomTitleSuffix()}`,
            authorId: author.id,
            dungeonConfig: bookConfig,
            theme: author.style.theme,
            description: author.description
        };
    }

    getRandomTitleSuffix() {
        const suffixes = ['회고록', '비망록', '악몽', '시집', '전술서', '환상곡'];
        return suffixes[Math.floor(Math.random() * suffixes.length)];
    }
}
