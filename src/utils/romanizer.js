const HANGUL_SYLLABLES_START = 0xac00
const HANGUL_SYLLABLES_END = 0xd7a3

const KOREAN_ONLY_REGEX = /^[ㄱ-ㅎㅏ-ㅣ가-힣\s]+$/;

export function isOnlyKorean(value) {
    return KOREAN_ONLY_REGEX.test(value);
}

export function isHangulSyllable(character) {
    if (typeof character !== "string" || character.length !== 1) {
        return false
    }

    const characterCode = character.charCodeAt(0)
    return characterCode >= HANGUL_SYLLABLES_START && characterCode <= HANGUL_SYLLABLES_END
}

export function convertHangulSyllableToJamoString(syllable) {
    if (!isHangulSyllable(syllable)) {
        return syllable
    }

    let characterCode = syllable.charCodeAt(0)
    characterCode -= HANGUL_SYLLABLES_START

    let jamoString = ""

    const jamoData = [
        { unicodeStart: 0x1100, divisor: 588 },
        { unicodeStart: 0x1161, divisor: 28 },
        { unicodeStart: 0x11a7, divisor: 1 },
    ]

    for (const jamo of jamoData) {
        const jamoOffset = Math.floor(characterCode / jamo.divisor)
        characterCode %= jamo.divisor
        jamoString += String.fromCharCode(jamo.unicodeStart + jamoOffset)
    }

    return jamoString
}

export function romanize(input) {
    if (typeof input !== "string") {
        return ""
    }

    let output = ""
    let specialcharAt = ""

    // Convert each character to Jamo string
    for (let i = 0; i < input.length; ++i) {
        const character = input.charAt(i)

        if (isHangulSyllable(character)) {
            output += convertHangulSyllableToJamoString(character)
        } else {
            output += character
        }
    }

    const romanizationRules = getRomanizationRules()

    let beforeText = ""
    const check = /[A-Za-z]/
    let temp = ""

    // Apply romanization rules
    for (const rule of romanizationRules) {
        output = output.replace(rule.pattern, rule.replacement)

        if (check.test(output)) {
            temp = beforeText.normalize()
            break
        }

        beforeText = output
    }

    // Process each character individually
    const arr = []
    for (let j = 0; j < temp.length; j++) {
        const character = temp.charAt(j)
        let charOutput = convertHangulSyllableToJamoString(character)

        for (const rule of romanizationRules) {
            charOutput = charOutput.replace(rule.pattern, rule.replacement)
        }

        arr.push(charOutput)
    }

    // Handle special characters
    arr.forEach((char) => {
        if (char === "!" || char === "?") {
            specialcharAt = char
        }
    })

    // Join with hyphens and clean up spaces
    const strWithHyphen = arr.join("-").split("")

    strWithHyphen.forEach((char, index) => {
        if (char === " ") {
            if (index > 0) strWithHyphen[index - 1] = ""
            if (index < strWithHyphen.length - 1) strWithHyphen[index + 1] = ""
        }
    })

    output = strWithHyphen.join("")

    // Clean up special characters
    if (specialcharAt) {
        const specialcharAtIdx = output.indexOf(specialcharAt)

        if (specialcharAtIdx > 0 && output[specialcharAtIdx - 1] === "-") {
            const chars = output.split("")
            chars.splice(specialcharAtIdx - 1, 1)
            output = chars.join("")
        }

        const newIdx = output.indexOf(specialcharAt)
        if (newIdx < output.length - 1 && output[newIdx + 1] === "-") {
            const chars = output.split("")
            chars.splice(newIdx + 1, 1)
            output = chars.join("")
        }
    }

    return output
}

function getRomanizationRules() {
    return [
        // Eliminate all empty batchim
        { pattern: /ᆧ/g, replacement: "" },

        // Nasal assimilation
        { pattern: /[ᆸᇁᆹᆲᆵ](?=[ᄂᄆ])/g, replacement: "ᆷ" },
        { pattern: /[ᆮᇀᆽᆾᆺᆻᇂ](?=[ᄂᄆ])/g, replacement: "ᆫ" },
        { pattern: /[ᆨᆩᆿᆪᆰ](?=[ᄂᄆ])/g, replacement: "ᆼ" },

        // Epenthetic ㄴ and ㄹ
        { pattern: /ᆨᄋ(?=[ᅣᅤᅧᅨᅭᅲ])/g, replacement: "ᆼᄂ" },
        { pattern: /ᆯᄋ(?=[ᅣᅤᅧᅨᅭᅲ])/g, replacement: "ᆯᄅ" },

        // Assimilation of adjacent consonants
        { pattern: /[ᆨᆼ]ᄅ/g, replacement: "ᆼᄂ" },
        { pattern: /ᆫᄅ(?=ᅩ)/g, replacement: "ᆫᄂ" },
        { pattern: /ᆯᄂ|ᆫᄅ/g, replacement: "ᆯᄅ" },
        { pattern: /[ᆷᆸ]ᄅ/g, replacement: "ᆷᄂ" },
        { pattern: /ᆰᄅ/g, replacement: "ᆨᄅ" },

        // Hyphenate ambiguous consonant sequences
        { pattern: /ᆨᄏ/g, replacement: "ᆨ-ᄏ" },
        { pattern: /ᆸᄑ/g, replacement: "ᆸ-ᄑ" },
        { pattern: /ᆮᄐ/g, replacement: "ᆮ-ᄐ" },

        // Expand complex batchim
        { pattern: /ᆪ/g, replacement: "ᆨᆺ" },
        { pattern: /ᆬ/g, replacement: "ᆫᆽ" },
        { pattern: /ᆭ/g, replacement: "ᆫᇂ" },
        { pattern: /ᆰ/g, replacement: "ᆯᆨ" },
        { pattern: /ᆱ/g, replacement: "ᆯᆷ" },
        { pattern: /ᆲ/g, replacement: "ᆯᆸ" },
        { pattern: /ᆳ/g, replacement: "ᆯᆺ" },
        { pattern: /ᆴ/g, replacement: "ᆯᇀ" },
        { pattern: /ᆵ/g, replacement: "ᆯᇁ" },
        { pattern: /ᆶ/g, replacement: "ᆯᇂ" },
        { pattern: /ᆹ/g, replacement: "ᆸᆺ" },

        // Cases of palatalization
        { pattern: /ᆮ이/g, replacement: "지" },
        { pattern: /ᇀ이/g, replacement: "치" },

        // Convert batchim followed by ᄋ
        { pattern: /ᆨᄋ/g, replacement: "ᄀ" },
        { pattern: /ᆩᄋ/g, replacement: "ᄁ" },
        { pattern: /ᆮᄋ/g, replacement: "ᄃ" },
        { pattern: /ᆯᄋ/g, replacement: "ᄅ" },
        { pattern: /ᆸᄋ/g, replacement: "ᄇ" },
        { pattern: /ᆺᄋ/g, replacement: "ᄉ" },
        { pattern: /ᆻᄋ/g, replacement: "ᄊ" },
        { pattern: /ᆽᄋ/g, replacement: "ᄌ" },
        { pattern: /ᆾᄋ/g, replacement: "ᄎ" },
        { pattern: /ᇂᄋ/g, replacement: "" },

        // Cases where consonants are adjacent to ㅎ
        { pattern: /ᇂᄀ|ᆨᄒ/g, replacement: "ᄏ" },
        { pattern: /ᇂᄃ|ᆮᄒ/g, replacement: "ᄐ" },
        { pattern: /ᇂᄌ|ᆽᄒ/g, replacement: "ᄎ" },
        { pattern: /ᇂᄇ/g, replacement: "ᄇ" },
        { pattern: /ᆸᄒ/g, replacement: "ᄑ" },

        // Special case for ᆯᄅ
        { pattern: /ᆯᄅ/g, replacement: "ll" },

        // Eliminate remaining ᇂ-batchim
        { pattern: /ᇂ(?!\s|$)/g, replacement: "" },

        // Eliminate adjacent batchim
        { pattern: /([ᆨᆩᆫᆮᆯᆷᆸᆺᆻᆼᆽᆾᆿᇀᇁᇂ])([ᆨᆩᆫᆮᆯᆷᆸᆺᆻᆼᆽᆾᆿᇀᇁᇂ])/g, replacement: "$1" },

        // Initial Jamo
        { pattern: /ᄀ/g, replacement: "g" },
        { pattern: /ᄁ/g, replacement: "kk" },
        { pattern: /ᄂ/g, replacement: "n" },
        { pattern: /ᄃ/g, replacement: "d" },
        { pattern: /ᄄ/g, replacement: "tt" },
        { pattern: /ᄅ/g, replacement: "r" },
        { pattern: /ᄆ/g, replacement: "m" },
        { pattern: /ᄇ/g, replacement: "b" },
        { pattern: /ᄈ/g, replacement: "pp" },
        { pattern: /ᄉ/g, replacement: "s" },
        { pattern: /ᄊ/g, replacement: "ss" },
        { pattern: /ᄋ/g, replacement: "" },
        { pattern: /ᄌ/g, replacement: "j" },
        { pattern: /ᄍ/g, replacement: "jj" },
        { pattern: /ᄎ/g, replacement: "ch" },
        { pattern: /ᄏ/g, replacement: "k" },
        { pattern: /ᄐ/g, replacement: "t" },
        { pattern: /ᄑ/g, replacement: "p" },
        { pattern: /ᄒ/g, replacement: "h" },

        // Medial Jamo
        { pattern: /ᅡ/g, replacement: "a" },
        { pattern: /ᅢ/g, replacement: "ae" },
        { pattern: /ᅣ/g, replacement: "ya" },
        { pattern: /ᅤ/g, replacement: "yae" },
        { pattern: /ᅥ/g, replacement: "eo" },
        { pattern: /ᅦ/g, replacement: "e" },
        { pattern: /ᅧ/g, replacement: "yeo" },
        { pattern: /ᅨ/g, replacement: "ye" },
        { pattern: /ᅩ/g, replacement: "o" },
        { pattern: /ᅪ/g, replacement: "wa" },
        { pattern: /ᅫ/g, replacement: "wae" },
        { pattern: /ᅬ/g, replacement: "oe" },
        { pattern: /ᅭ/g, replacement: "yo" },
        { pattern: /ᅮ/g, replacement: "u" },
        { pattern: /ᅯ/g, replacement: "wo" },
        { pattern: /ᅰ/g, replacement: "we" },
        { pattern: /ᅱ/g, replacement: "wi" },
        { pattern: /ᅲ/g, replacement: "yu" },
        { pattern: /ᅳ/g, replacement: "eu" },
        { pattern: /ᅴ/g, replacement: "ui" },
        { pattern: /ᅵ/g, replacement: "i" },

        // Final Jamo
        { pattern: /ᆨ/g, replacement: "k" },
        { pattern: /ᆩ/g, replacement: "k" },
        { pattern: /ᆪ/g, replacement: "k" },
        { pattern: /ᆫ/g, replacement: "n" },
        { pattern: /ᆮ/g, replacement: "t" },
        { pattern: /ᆯ/g, replacement: "l" },
        { pattern: /ᆷ/g, replacement: "m" },
        { pattern: /ᆸ/g, replacement: "p" },
        { pattern: /ᆺ/g, replacement: "t" },
        { pattern: /ᆻ/g, replacement: "t" },
        { pattern: /ᆼ/g, replacement: "ng" },
        { pattern: /ᆽ/g, replacement: "t" },
        { pattern: /ᆾ/g, replacement: "t" },
        { pattern: /ᆿ/g, replacement: "k" },
        { pattern: /ᇀ/g, replacement: "t" },
        { pattern: /ᇁ/g, replacement: "p" },
        { pattern: /ᇂ/g, replacement: "t" },
    ]
}