package com.belledonne.ecommerce.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public class SlugUtil {
    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    public static String toSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String whitespace = WHITESPACE.matcher(normalized).replaceAll("-");
        String slug = NON_LATIN.matcher(whitespace).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH)
                   .replaceAll("-{2,}", "-")
                   .replaceAll("^-|-$", "");
    }
}
