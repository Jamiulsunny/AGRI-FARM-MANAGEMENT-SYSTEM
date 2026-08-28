 /*=====================================================================
 * AGRI FARM MANAGEMENT SYSTEM
 * ---------------------------------------------------------------------
 * A console based livestock record management system written in
 * strict C11. Provides add / view / search / edit / delete / summary
 * / save / help functionality for a farm's animal records, backed
 * by a simple pipe-delimited text file.
 *
 * Author  : Agri Farm Dev Team
 * Version : 1.0.0
 * Standard: C11
 * ===================================================================== */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdbool.h>

/* =====================================================================
 * SECTION: CONSTANTS
 * ===================================================================== */

#define MAX_ANIMALS   1000
#define MAX_NAME      50
#define MAX_TYPE      30
#define MAX_BREED     40
#define MAX_STATUS    30
#define INPUT_SIZE    256
#define FILE_LINE_SIZE 512
#define PATH_SIZE     1024

#define DATA_FILE       "animals.txt"
#define TEMP_FILE       "animals.txt.tmp"
#define BACKUP_FILE     "animals.txt.bak"

#define APP_NAME    "AGRI FARM MANAGEMENT SYSTEM"
#define APP_VERSION "1.0.0"
#define APP_AUTHOR  "Agri Farm Dev Team"

*/ =====================================================================
 * SECTION: DATA MODEL
 * ===================================================================== */

typedef struct {
    unsigned int id;
    char tag[MAX_NAME + 1];
    char type[MAX_TYPE + 1];
    char breed[MAX_BREED + 1];
    char gender[10];
    char birthDate[11];   /* YYYY-MM-DD */
    float weight;
    char healthStatus[MAX_STATUS + 1];
    int deleted;           /* 0 = active, 1 = soft deleted */
} Animal;

typedef struct {
    Animal animals[MAX_ANIMALS];
    size_t count;
    unsigned int nextID;
    int dirty;              /* 1 if unsaved changes exist */
    char filename[PATH_SIZE];
} Store;

/* =====================================================================
 * SECTION: FUNCTION PROTOTYPES
 * ===================================================================== */

/* input helpers */
static void  flushStdin(void);
static bool  readLine(char *buffer, size_t size);
static void  trimWhitespace(char *str);
static bool  isBlank(const char *str);

/* validation helpers */
static bool  isValidGender(const char *g);
static bool  isValidDate(const char *d);
static bool  isLeapYear(int year);
static bool  isValidWeightStr(const char *s, float *out);
static bool  isValidHealthStatus(const char *s);
static void  toLowerCopy(char *dst, const char *src, size_t size);

/* store helpers */
static void  storeInit(Store *store, const char *filename);
static int   storeFindIndexByID(const Store *store, unsigned int id);
static bool  storeTagExists(const Store *store, const char *tag, int excludeIndex);
static void  storeLoad(Store *store);
static bool  storeSave(Store *store);
static int   ciStrCmp(const char *a, const char *b);
static bool  strcaseContains(const char *haystack, const char *needle);

/* feature functions */
static void  featureAddAnimal(Store *store);
static void  featureViewAll(const Store *store);
static void  featureSearch(const Store *store);
static void  featureEdit(Store *store);
static void  featureDelete(Store *store);
static void  featureSummary(const Store *store);
static void  featureHelp(void);

/* utility / display */
static void  printHeader(void);
static void  printAnimalRow(const Animal *a);
static void  printAnimalTableHeader(void);
static void  pauseForUser(void);
static unsigned int promptID(const char *prompt);

/* =====================================================================
 * SECTION: INPUT HELPERS
 * ===================================================================== */

static void flushStdin(void)
{
    int c;
    while ((c = getchar()) != '\n' && c != EOF) {
        /* discard */
    }
}

/* Reads a line safely using fgets, strips trailing newline.
 * Returns false on EOF with no data read. */
static bool readLine(char *buffer, size_t size)
{
    if (buffer == NULL || size == 0) {
        return false;
    }

    if (fgets(buffer, (int)size, stdin) == NULL) {
        buffer[0] = '\0';
        return false;
    }

    size_t len = strlen(buffer);
    if (len > 0 && buffer[len - 1] == '\n') {
        buffer[len - 1] = '\0';
    } else if (len == size - 1) {
        /* Line longer than buffer: discard remainder of the line */
        flushStdin();
    }

    trimWhitespace(buffer);
    return true;
}

static void trimWhitespace(char *str)
{
    if (str == NULL) {
        return;
    }

    /* trim leading */
    size_t start = 0;
    while (str[start] != '\0' && isspace((unsigned char)str[start])) {
        start++;
    }

    size_t len = strlen(str);
    if (start > 0) {
        memmove(str, str + start, len - start + 1);
        len -= start;
    }

    /* trim trailing */
    while (len > 0 && isspace((unsigned char)str[len - 1])) {
        str[len - 1] = '\0';
        len--;
    }
}

static bool isBlank(const char *str)
{
    if (str == NULL) {
        return true;
    }
    while (*str != '\0') {
        if (!isspace((unsigned char)*str)) {
            return false;
        }
        str++;
    }
    return true;
}

static void toLowerCopy(char *dst, const char *src, size_t size)
{
    size_t i = 0;
    for (; i < size - 1 && src[i] != '\0'; i++) {
        dst[i] = (char)tolower((unsigned char)src[i]);
    }
    dst[i] = '\0';
}

/* =====================================================================
 * SECTION: VALIDATION HELPERS
 * ===================================================================== */

static bool isValidGender(const char *g)
{
    char lower[10];
    toLowerCopy(lower, g, sizeof(lower));
    return (strcmp(lower, "male") == 0 || strcmp(lower, "female") == 0);
}

static bool isLeapYear(int year)
{
    return ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0));
}

static bool isValidDate(const char *d)
{
    /* Expect strictly YYYY-MM-DD, 10 characters */
    if (d == NULL || strlen(d) != 10) {
        return false;
    }
    if (d[4] != '-' || d[7] != '-') {
        return false;
    }

    for (int i = 0; i < 10; i++) {
        if (i == 4 || i == 7) continue;
        if (!isdigit((unsigned char)d[i])) {
            return false;
        }
    }

    int year, month, day;
    if (sscanf(d, "%4d-%2d-%2d", &year, &month, &day) != 3) {
        return false;
    }

    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    static const int daysInMonth[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    int maxDay = daysInMonth[month - 1];
    if (month == 2 && isLeapYear(year)) {
        maxDay = 29;
    }

    if (day > maxDay) return false;

    return true;
}

static bool isValidWeightStr(const char *s, float *out)
{
    if (s == NULL || isBlank(s)) {
        return false;
    }

    char *endptr = NULL;
    float value = strtof(s, &endptr);

    if (endptr == s) {
        return false; /* no conversion */
    }
    /* skip trailing whitespace */
    while (*endptr != '\0' && isspace((unsigned char)*endptr)) {
        endptr++;
    }
    if (*endptr != '\0') {
        return false; /* junk after number */
    }
    if (value <= 0.0f) {
        return false;
    }

    if (out != NULL) {
        *out = value;
    }
    return true;
}

static bool isValidHealthStatus(const char *s)
{
    /* Accept any non-blank string up to MAX_STATUS chars.
     * Common statuses are suggested but custom text is allowed. */
    if (s == NULL || isBlank(s)) {
        return false;
    }
    if (strlen(s) > MAX_STATUS) {
        return false;
    }
    return true;
}

/* =====================================================================
 * SECTION: STORE HELPERS
 * ===================================================================== */

static void storeInit(Store *store, const char *filename)
{
    store->count = 0;
    store->nextID = 1;
    store->dirty = 0;
    memset(store->animals, 0, sizeof(store->animals));
    strncpy(store->filename, filename, PATH_SIZE - 1);
    store->filename[PATH_SIZE - 1] = '\0';
}

static int storeFindIndexByID(const Store *store, unsigned int id)
{
    for (size_t i = 0; i < store->count; i++) {
        if (store->animals[i].id == id && store->animals[i].deleted == 0) {
            return (int)i;
        }
    }
    return -1;
}

static bool storeTagExists(const Store *store, const char *tag, int excludeIndex)
{
    for (size_t i = 0; i < store->count; i++) {
        if ((int)i == excludeIndex) continue;
        if (store->animals[i].deleted == 1) continue;
        if (ciStrCmp(store->animals[i].tag, tag) == 0) {
            return true;
        }
    }
    return false;
}

/* Portable case-insensitive compare (avoids relying on non-C11 strcasecmp
 * from POSIX; implemented manually to remain strictly C11 compliant). */
static int ciStrCmp(const char *a, const char *b)
{
    while (*a != '\0' && *b != '\0') {
        int ca = tolower((unsigned char)*a);
        int cb = tolower((unsigned char)*b);
        if (ca != cb) {
            return ca - cb;
        }
        a++;
        b++;
    }
    return (unsigned char)*a - (unsigned char)*b;
}

static bool strcaseContains(const char *haystack, const char *needle)
{
    char h[FILE_LINE_SIZE];
    char n[FILE_LINE_SIZE];
    toLowerCopy(h, haystack, sizeof(h));
    toLowerCopy(n, needle, sizeof(n));
    return strstr(h, n) != NULL;
}

static void storeLoad(Store *store)
{
    FILE *fp = fopen(store->filename, "r");
    if (fp == NULL) {
        /* No file yet -- start with an empty database. */
        printf("[INFO] No existing data file found. Starting with empty database.\n");
        return;
    }

    char line[FILE_LINE_SIZE];
    unsigned int maxID = 0;

    while (fgets(line, sizeof(line), fp) != NULL) {
        if (store->count >= MAX_ANIMALS) {
            printf("[WARN] Maximum animal capacity reached while loading. Extra records ignored.\n");
            break;
        }

        /* Strip newline */
        size_t len = strlen(line);
        if (len > 0 && line[len - 1] == '\n') {
            line[len - 1] = '\0';
        }
        if (isBlank(line)) {
            continue;
        }

        Animal a;
        memset(&a, 0, sizeof(a));

        char idStr[32] = {0};
        char weightStr[32] = {0};
        char deletedStr[8] = {0};

        char lineCopy[FILE_LINE_SIZE];
        strncpy(lineCopy, line, sizeof(lineCopy) - 1);
        lineCopy[sizeof(lineCopy) - 1] = '\0';

        char *token = NULL;
        int field = 0;

        token = strtok(lineCopy, "|");
        while (token != NULL && field < 9) {
            switch (field) {
                case 0: strncpy(idStr, token, sizeof(idStr) - 1); break;
                case 1: strncpy(a.tag, token, MAX_NAME); break;
                case 2: strncpy(a.type, token, MAX_TYPE); break;
                case 3: strncpy(a.breed, token, MAX_BREED); break;
                case 4: strncpy(a.gender, token, sizeof(a.gender) - 1); break;
                case 5: strncpy(a.birthDate, token, sizeof(a.birthDate) - 1); break;
                case 6: strncpy(weightStr, token, sizeof(weightStr) - 1); break;
                case 7: strncpy(a.healthStatus, token, MAX_STATUS); break;
                case 8: strncpy(deletedStr, token, sizeof(deletedStr) - 1); break;
                default: break;
            }
            field++;
            token = strtok(NULL, "|");
        }

        if (field < 9) {
            printf("[WARN] Skipping malformed line in data file: %s\n", line);
            continue;
        }

        a.id = (unsigned int)strtoul(idStr, NULL, 10);
        a.weight = strtof(weightStr, NULL);
        a.deleted = (int)strtol(deletedStr, NULL, 10);

        if (a.id > maxID) {
            maxID = a.id;
        }

        store->animals[store->count] = a;
        store->count++;
    }

    fclose(fp);
    store->nextID = maxID + 1;
    printf("[INFO] Loaded %zu record(s) from '%s'.\n", store->count, store->filename);
}

static bool storeSave(Store *store)
{
    FILE *fp = fopen(TEMP_FILE, "w");
    if (fp == NULL) {
        printf("[ERROR] Could not open temporary file for saving.\n");
        return false;
    }

    for (size_t i = 0; i < store->count; i++) {
        const Animal *a = &store->animals[i];
        int written = fprintf(fp, "%u|%s|%s|%s|%s|%s|%.2f|%s|%d\n",
                               a->id, a->tag, a->type, a->breed, a->gender,
                               a->birthDate, (double)a->weight, a->healthStatus, a->deleted);
        if (written < 0) {
            printf("[ERROR] Write failure while saving records.\n");
            fclose(fp);
            remove(TEMP_FILE);
            return false;
        }
    }

    if (fclose(fp) != 0) {
        printf("[ERROR] Could not finalize temporary file.\n");
        return false;
    }

    /* Backup existing file (if any) before replacing it. */
    FILE *existing = fopen(store->filename, "r");
    if (existing != NULL) {
        fclose(existing);
        remove(BACKUP_FILE);
        if (rename(store->filename, BACKUP_FILE) != 0) {
            printf("[WARN] Could not create backup file. Continuing anyway.\n");
        }
    }

    if (rename(TEMP_FILE, store->filename) != 0) {
        printf("[ERROR] Could not finalize data file. Attempting to restore backup.\n");
        FILE *backupCheck = fopen(BACKUP_FILE, "r");
        if (backupCheck != NULL) {
            fclose(backupCheck);
            rename(BACKUP_FILE, store->filename);
        }
        return false;
    }

    store->dirty = 0;
    printf("[INFO] Saved %zu record(s) to '%s'.\n", store->count, store->filename);
    return true;
}

/* =====================================================================
 * SECTION: DISPLAY HELPERS
 * ===================================================================== */

static void printHeader(void)
{
    printf("\n============================\n");
    printf(" %s\n", APP_NAME);
    printf("============================\n");
}

static void printAnimalTableHeader(void)
{
    printf("%-4s %-12s %-10s %-12s %-8s %-12s %-8s %-12s\n",
           "ID", "Tag", "Type", "Breed", "Gender", "Birth Date", "Weight", "Health");
    printf("--------------------------------------------------------------------------------------\n");
}

static void printAnimalRow(const Animal *a)
{
    printf("%-4u %-12s %-10s %-12s %-8s %-12s %-8.2f %-12s\n",
           a->id, a->tag, a->type, a->breed, a->gender,
           a->birthDate, (double)a->weight, a->healthStatus);
}

static void pauseForUser(void)
{
    printf("\nPress ENTER to continue...");
    char buf[INPUT_SIZE];
    readLine(buf, sizeof(buf));
}

static unsigned int promptID(const char *prompt)
{
    char buf[INPUT_SIZE];
    printf("%s", prompt);
    if (!readLine(buf, sizeof(buf))) {
        return 0;
    }
    if (isBlank(buf)) {
        return 0;
    }
    for (size_t i = 0; buf[i] != '\0'; i++) {
        if (!isdigit((unsigned char)buf[i])) {
            return 0;
        }
    }
    return (unsigned int)strtoul(buf, NULL, 10);
}

/* =====================================================================
 * SECTION: FEATURE 1 - ADD ANIMAL
 * ===================================================================== */

static void featureAddAnimal(Store *store)
{
    printf("\n--- Add Animal ---\n");

    if (store->count >= MAX_ANIMALS) {
        printf("[ERROR] Maximum animal capacity (%d) reached. Cannot add more.\n", MAX_ANIMALS);
        return;
    }

    Animal a;
    memset(&a, 0, sizeof(a));
    char buf[INPUT_SIZE];

    /* Tag */
    while (true) {
        printf("Animal Tag: ");
        if (!readLine(buf, sizeof(buf))) return;
        if (isBlank(buf)) {
            printf("[ERROR] Tag cannot be empty.\n");
            continue;
        }
        if (strlen(buf) > MAX_NAME) {
            printf("[ERROR] Tag too long (max %d characters).\n", MAX_NAME);
            continue;
        }
        if (storeTagExists(store, buf, -1)) {
            printf("[ERROR] Duplicate tag. Please choose a unique tag.\n");
            continue;
        }
        strncpy(a.tag, buf, MAX_NAME);
        break;
    }

    /* Type */
    while (true) {
        printf("Animal Type (e.g. Cow, Goat, Sheep): ");
        if (!readLine(buf, sizeof(buf))) return;
        if (isBlank(buf)) {
            printf("[ERROR] Type cannot be empty.\n");
            continue;
        }
        if (strlen(buf) > MAX_TYPE) {
            printf("[ERROR] Type too long (max %d characters).\n", MAX_TYPE);
            continue;
        }
        strncpy(a.type, buf, MAX_TYPE);
        break;
    }

    /* Breed */
    while (true) {
        printf("Breed: ");
        if (!readLine(buf, sizeof(buf))) return;
        if (isBlank(buf)) {
            printf("[ERROR] Breed cannot be empty.\n");
            continue;
        }
        if (strlen(buf) > MAX_BREED) {
            printf("[ERROR] Breed too long (max %d characters).\n", MAX_BREED);
            continue;
        }
        strncpy(a.breed, buf, MAX_BREED);
        break;
    }

    /* Gender */
    while (true) {
        printf("Gender (Male/Female): ");
        if (!readLine(buf, sizeof(buf))) return;
        if (!isValidGender(buf)) {
            printf("[ERROR] Gender must be Male or Female.\n");
            continue;
        }
        strncpy(a.gender, buf, sizeof(a.gender) - 1);
        break;
    }

    /* Birth Date */
    while (true) {
        printf("Birth Date (YYYY-MM-DD): ");
        if (!readLine(buf, sizeof(buf))) return;
        if (!isValidDate(buf)) {
            printf("[ERROR] Invalid date. Use format YYYY-MM-DD with a real calendar date.\n");
            continue;
        }
        strncpy(a.birthDate, buf, sizeof(a.birthDate) - 1);
        break;
    }

    /* Weight */
    while (true) {
        float w;
        printf("Weight (kg): ");
        if (!readLine(buf, sizeof(buf))) return;
        if (!isValidWeightStr(buf, &w)) {
            printf("[ERROR] Weight must be a positive number.\n");
            continue;
        }
        a.weight = w;
        break;
    }

    /* Health Status */
    while (true) {
        printf("Health Status (Healthy/Sick/Vaccinated/Pregnant/Treatment/custom): ");
        if (!readLine(buf, sizeof(buf))) return;
        if (!isValidHealthStatus(buf)) {
            printf("[ERROR] Health status cannot be empty (max %d characters).\n", MAX_STATUS);
            continue;
        }
        strncpy(a.healthStatus, buf, MAX_STATUS);
        break;
    }

    a.id = store->nextID++;
    a.deleted = 0;

    store->animals[store->count] = a;
    store->count++;
    store->dirty = 1;

    printf("\n[SUCCESS] Animal added with ID %u.\n", a.id);
}

/* =====================================================================
 * SECTION: FEATURE 2 - VIEW ALL
 * ===================================================================== */

static void featureViewAll(const Store *store)
{
    printf("\n--- All Animals ---\n");

    size_t activeCount = 0;
    for (size_t i = 0; i < store->count; i++) {
        if (store->animals[i].deleted == 0) activeCount++;
    }

    if (activeCount == 0) {
        printf("No animal records found.\n");
        return;
    }

    printAnimalTableHeader();
    for (size_t i = 0; i < store->count; i++) {
        if (store->animals[i].deleted == 1) continue;
        printAnimalRow(&store->animals[i]);
    }

    printf("--------------------------------------------------------------------------------------\n");
    printf("Total animals: %zu\n", activeCount);
}

/* =====================================================================
 * SECTION: FEATURE 3 - SEARCH
 * ===================================================================== */

static void featureSearch(const Store *store)
{
    printf("\n--- Search Animal ---\n");
    printf("Search by:\n");
    printf("1. ID\n2. Tag\n3. Type\n4. Breed\n5. Health Status\n");
    printf("Choose an option: ");

    char buf[INPUT_SIZE];
    if (!readLine(buf, sizeof(buf))) return;

    int option = atoi(buf);
    bool found = false;

    if (option == 1) {
        unsigned int id = promptID("Enter ID: ");
        if (id == 0) {
            printf("[ERROR] Invalid ID.\n");
            return;
        }
        for (size_t i = 0; i < store->count; i++) {
            if (store->animals[i].deleted == 0 && store->animals[i].id == id) {
                printAnimalTableHeader();
                printAnimalRow(&store->animals[i]);
                found = true;
                break;
            }
        }
    } else if (option >= 2 && option <= 5) {
        char query[INPUT_SIZE];
        printf("Enter search text: ");
        if (!readLine(query, sizeof(query))) return;
        if (isBlank(query)) {
            printf("[ERROR] Search text cannot be empty.\n");
            return;
        }

        printAnimalTableHeader();
        for (size_t i = 0; i < store->count; i++) {
            if (store->animals[i].deleted == 1) continue;
            const Animal *a = &store->animals[i];
            bool match = false;

            switch (option) {
                case 2: match = strcaseContains(a->tag, query); break;
                case 3: match = strcaseContains(a->type, query); break;
                case 4: match = strcaseContains(a->breed, query); break;
                case 5: match = strcaseContains(a->healthStatus, query); break;
                default: break;
            }

            if (match) {
                printAnimalRow(a);
                found = true;
            }
        }
    } else {
        printf("[ERROR] Invalid search option.\n");
        return;
    }

    if (!found) {
        printf("No Record Found\n");
    }
}

/* =====================================================================
 * SECTION: FEATURE 4 - EDIT
 * ===================================================================== */

static void featureEdit(Store *store)
{
    printf("\n--- Edit Animal ---\n");
    unsigned int id = promptID("Enter Animal ID to edit: ");
    if (id == 0) {
        printf("[ERROR] Invalid ID.\n");
        return;
    }

    int idx = storeFindIndexByID(store, id);
    if (idx == -1) {
        printf("No Record Found\n");
        return;
    }

    Animal *a = &store->animals[idx];
    printf("\nCurrent record:\n");
    printAnimalTableHeader();
    printAnimalRow(a);

    printf("\nEnter new values, or press ENTER to keep the current value.\n");
    char buf[INPUT_SIZE];

    /* Tag */
    while (true) {
        printf("Tag [%s]: ", a->tag);
        if (!readLine(buf, sizeof(buf))) return;
        if (isBlank(buf)) break; /* keep old */
        if (strlen(buf) > MAX_NAME) {
            printf("[ERROR] Tag too long (max %d characters).\n", MAX_NAME);
            continue;
        }
        if (storeTagExists(store, buf, idx)) {
            printf("[ERROR] Duplicate tag. Please choose a unique tag.\n");
            continue;
        }
        strncpy(a->tag, buf, MAX_NAME);
        break;
    }

    /* Type */
    printf("Type [%s]: ", a->type);
    if (!readLine(buf, sizeof(buf))) return;
    if (!isBlank(buf)) {
        if (strlen(buf) <= MAX_TYPE) {
            strncpy(a->type, buf, MAX_TYPE);
        } else {
            printf("[WARN] Type too long, keeping old value.\n");
        }
    }

    /* Breed */
    printf("Breed [%s]: ", a->breed);
    if (!readLine(buf, sizeof(buf))) return;
    if (!isBlank(buf)) {
        if (strlen(buf) <= MAX_BREED) {
            strncpy(a->breed, buf, MAX_BREED);
        } else {
            printf("[WARN] Breed too long, keeping old value.\n");
        }
    }

    /* Gender */
    while (true) {
        printf("Gender [%s]: ", a->gender);
        if (!readLine(buf, sizeof(buf))) return;
        if (isBlank(buf)) break;
        if (!isValidGender(buf)) {
            printf("[ERROR] Gender must be Male or Female.\n");
            continue;
        }
        strncpy(a->gender, buf, sizeof(a->gender) - 1);
        break;
    }

    /* Birth Date */
    while (true) {
        printf("Birth Date [%s]: ", a->birthDate);
        if (!readLine(buf, sizeof(buf))) return;
        if (isBlank(buf)) break;
        if (!isValidDate(buf)) {
            printf("[ERROR] Invalid date format.\n");
            continue;
        }
        strncpy(a->birthDate, buf, sizeof(a->birthDate) - 1);
        break;
    }

    /* Weight */
    while (true) {
        printf("Weight [%.2f]: ", (double)a->weight);
        if (!readLine(buf, sizeof(buf))) return;
        if (isBlank(buf)) break;
        float w;
        if (!isValidWeightStr(buf, &w)) {
            printf("[ERROR] Weight must be a positive number.\n");
            continue;
        }
        a->weight = w;
        break;
    }

    /* Health Status */
    while (true) {
        printf("Health Status [%s]: ", a->healthStatus);
        if (!readLine(buf, sizeof(buf))) return;
        if (isBlank(buf)) break;
        if (!isValidHealthStatus(buf)) {
            printf("[ERROR] Invalid health status.\n");
            continue;
        }
        strncpy(a->healthStatus, buf, MAX_STATUS);
        break;
    }

    printf("\nSave changes? (Y/N): ");
    if (!readLine(buf, sizeof(buf))) return;
    if (buf[0] == 'y' || buf[0] == 'Y') {
        store->dirty = 1;
        printf("[SUCCESS] Record updated.\n");
    } else {
        printf("[INFO] Edit discarded (in-memory changes were already applied; reload without saving to discard permanently).\n");
    }
}

/* =====================================================================
 * SECTION: FEATURE 5 - DELETE
 * ===================================================================== */

static void featureDelete(Store *store)
{
    printf("\n--- Delete Animal ---\n");
    unsigned int id = promptID("Enter Animal ID to delete: ");
    if (id == 0) {
        printf("[ERROR] Invalid ID.\n");
        return;
    }

    int idx = storeFindIndexByID(store, id);
    if (idx == -1) {
        printf("No Record Found\n");
        return;
    }

    Animal *a = &store->animals[idx];
    printAnimalTableHeader();
    printAnimalRow(a);

    printf("\nAre you sure you want to delete this record? (Y/N): ");
    char buf[INPUT_SIZE];
    if (!readLine(buf, sizeof(buf))) return;

    if (buf[0] == 'y' || buf[0] == 'Y') {
        a->deleted = 1;
        store->dirty = 1;
        printf("[SUCCESS] Record marked as deleted (soft delete).\n");
    } else {
        printf("[INFO] Delete cancelled.\n");
    }
}

/* =====================================================================
 * SECTION: FEATURE 6 - SUMMARY
 * ===================================================================== */

static void featureSummary(const Store *store)
{
    printf("\n--- Animal Summary ---\n");

    size_t total = 0, cows = 0, goats = 0, sheep = 0;
    size_t healthy = 0, sick = 0;
    double totalWeight = 0.0;
    const Animal *highest = NULL;
    const Animal *lowest = NULL;

    for (size_t i = 0; i < store->count; i++) {
        if (store->animals[i].deleted == 1) continue;
        const Animal *a = &store->animals[i];
        total++;

        char typeLower[MAX_TYPE + 1];
        toLowerCopy(typeLower, a->type, sizeof(typeLower));
        if (strcmp(typeLower, "cow") == 0) cows++;
        else if (strcmp(typeLower, "goat") == 0) goats++;
        else if (strcmp(typeLower, "sheep") == 0) sheep++;

        char healthLower[MAX_STATUS + 1];
        toLowerCopy(healthLower, a->healthStatus, sizeof(healthLower));
        if (strcmp(healthLower, "healthy") == 0) healthy++;
        else if (strcmp(healthLower, "sick") == 0) sick++;

        totalWeight += (double)a->weight;

        if (highest == NULL || a->weight > highest->weight) highest = a;
        if (lowest == NULL || a->weight < lowest->weight) lowest = a;
    }

    if (total == 0) {
        printf("No animal records available to summarize.\n");
        return;
    }

    printf("Total Animals     : %zu\n", total);
    printf("Total Cows         : %zu\n", cows);
    printf("Total Goats        : %zu\n", goats);
    printf("Total Sheep        : %zu\n", sheep);
    printf("Healthy Animals    : %zu\n", healthy);
    printf("Sick Animals       : %zu\n", sick);
    printf("Average Weight     : %.2f kg\n", totalWeight / (double)total);

    if (highest != NULL) {
        printf("Highest Weight     : %s (%.2f kg)\n", highest->tag, (double)highest->weight);
    }
    if (lowest != NULL) {
        printf("Lowest Weight      : %s (%.2f kg)\n", lowest->tag, (double)lowest->weight);
    }
}

/* =====================================================================
 * SECTION: FEATURE - HELP / ABOUT
 * ===================================================================== */

static void featureHelp(void)
{
    printf("\n--- Help / About ---\n");
    printf("Project Name : %s\n", APP_NAME);
    printf("Version      : %s\n", APP_VERSION);
    printf("Developer    : %s\n", APP_AUTHOR);
    printf("Data File    : %s (created in the working directory)\n", DATA_FILE);
    printf("\nUsage:\n");
    printf("  1. Add Animal      - Create a new livestock record.\n");
    printf("  2. View All        - List every active animal record.\n");
    printf("  3. Search Animal   - Find records by ID, Tag, Type, Breed, or Health.\n");
    printf("  4. Edit Animal     - Update an existing record by ID.\n");
    printf("  5. Delete Animal   - Soft-delete a record by ID (data is retained).\n");
    printf("  6. Animal Summary  - View aggregate herd statistics.\n");
    printf("  7. Save Records    - Persist current data to disk immediately.\n");
    printf("  8. Help/About      - Show this screen.\n");
    printf("  0. Save and Exit   - Persist data and close the application.\n");
    printf("\nData Format (animals.txt):\n");
    printf("  id|tag|type|breed|gender|birthdate|weight|health|deleted\n");
    printf("  Example: 1|COW001|Cow|Holstein|Female|2024-01-10|350.50|Healthy|0\n");
}

/* =====================================================================
 * SECTION: MAIN
 * ===================================================================== */

int main(void)
{
    Store store;
    storeInit(&store, DATA_FILE);
    storeLoad(&store);

    bool running = true;
    char buf[INPUT_SIZE];

    while (running) {
        printHeader();
        printf("1. Add Animal\n");
        printf("2. View All Animals\n");
        printf("3. Search Animal\n");
        printf("4. Edit Animal\n");
        printf("5. Delete Animal\n");
        printf("6. Animal Summary\n");
        printf("7. Save Records\n");
        printf("8. Help/About\n");
        printf("0. Save and Exit\n");
        printf("\nSelect an option: ");

        if (!readLine(buf, sizeof(buf))) {
            /* EOF encountered -- save and exit gracefully */
            printf("\n[INFO] End of input detected. Saving and exiting.\n");
            storeSave(&store);
            break;
        }

        if (isBlank(buf)) {
            printf("[ERROR] Please enter a valid menu option.\n");
            continue;
        }

        bool numeric = true;
        for (size_t i = 0; buf[i] != '\0'; i++) {
            if (!isdigit((unsigned char)buf[i])) {
                numeric = false;
                break;
            }
        }

        if (!numeric) {
            printf("[ERROR] Invalid option. Please enter a number from the menu.\n");
            continue;
        }

        int choice = atoi(buf);

        switch (choice) {
            case 1: featureAddAnimal(&store); pauseForUser(); break;
            case 2: featureViewAll(&store); pauseForUser(); break;
            case 3: featureSearch(&store); pauseForUser(); break;
            case 4: featureEdit(&store); pauseForUser(); break;
            case 5: featureDelete(&store); pauseForUser(); break;
            case 6: featureSummary(&store); pauseForUser(); break;
            case 7: storeSave(&store); pauseForUser(); break;
            case 8: featureHelp(); pauseForUser(); break;
            case 0:
                printf("\nSaving records before exit...\n");
                storeSave(&store);
                printf("Goodbye!\n");
                running = false;
                break;
            default:
                printf("[ERROR] Invalid option. Please choose a number between 0 and 8.\n");
                break;
        }
    }

    return EXIT_SUCCESS;
}
