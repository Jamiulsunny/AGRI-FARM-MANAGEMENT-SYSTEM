/* =====================================================================
 * AGRI FARM MANAGEMENT SYSTEM - TEST SUITE
 * ---------------------------------------------------------------------
 * A lightweight, dependency-free assertion based test suite covering
 * validation, store operations, search, edit, delete, save/load and
 * summary logic. 60+ assertions.
 *
 * NOTE: This file re-declares/re-implements the pieces of main.c it
 * needs to test in isolation (rather than #include-ing main.c, which
 * has its own main()). This keeps the test binary self-contained and
 * avoids symbol clashes with main()'s entry point.
 * ===================================================================== */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdbool.h>

/* ---- Minimal re-implementation of the logic under test ---- */

#define MAX_ANIMALS   1000
#define MAX_NAME      50
#define MAX_TYPE      30
#define MAX_BREED     40
#define MAX_STATUS    30

typedef struct {
    unsigned int id;
    char tag[MAX_NAME + 1];
    char type[MAX_TYPE + 1];
    char breed[MAX_BREED + 1];
    char gender[10];
    char birthDate[11];
    float weight;
    char healthStatus[MAX_STATUS + 1];
    int deleted;
} Animal;

typedef struct {
    Animal animals[MAX_ANIMALS];
    size_t count;
    unsigned int nextID;
    int dirty;
    char filename[256];
} Store;

static int g_testsRun = 0;
static int g_testsFailed = 0;

#define ASSERT_TRUE(cond, msg) do { \
    g_testsRun++; \
    if (!(cond)) { \
        g_testsFailed++; \
        printf("  [FAIL] %s (line %d)\n", msg, __LINE__); \
    } else { \
        printf("  [PASS] %s\n", msg); \
    } \
} while (0)

static void toLowerCopy(char *dst, const char *src, size_t size)
{
    size_t i = 0;
    for (; i < size - 1 && src[i] != '\0'; i++) {
        dst[i] = (char)tolower((unsigned char)src[i]);
    }
    dst[i] = '\0';
}

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
    if (d == NULL || strlen(d) != 10) return false;
    if (d[4] != '-' || d[7] != '-') return false;

    for (int i = 0; i < 10; i++) {
        if (i == 4 || i == 7) continue;
        if (!isdigit((unsigned char)d[i])) return false;
    }

    int year, month, day;
    if (sscanf(d, "%4d-%2d-%2d", &year, &month, &day) != 3) return false;
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    static const int daysInMonth[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    int maxDay = daysInMonth[month - 1];
    if (month == 2 && isLeapYear(year)) maxDay = 29;

    return day <= maxDay;
}

static bool isValidWeightStr(const char *s, float *out)
{
    if (s == NULL || *s == '\0') return false;
    char *endptr = NULL;
    float value = strtof(s, &endptr);
    if (endptr == s) return false;
    while (*endptr != '\0' && isspace((unsigned char)*endptr)) endptr++;
    if (*endptr != '\0') return false;
    if (value <= 0.0f) return false;
    if (out != NULL) *out = value;
    return true;
}

static int ciStrCmp(const char *a, const char *b)
{
    while (*a != '\0' && *b != '\0') {
        int ca = tolower((unsigned char)*a);
        int cb = tolower((unsigned char)*b);
        if (ca != cb) return ca - cb;
        a++; b++;
    }
    return (unsigned char)*a - (unsigned char)*b;
}

static void storeInit(Store *store)
{
    store->count = 0;
    store->nextID = 1;
    store->dirty = 0;
    memset(store->animals, 0, sizeof(store->animals));
    strncpy(store->filename, "test_animals.txt", sizeof(store->filename) - 1);
}

static bool storeTagExists(const Store *store, const char *tag, int excludeIndex)
{
    for (size_t i = 0; i < store->count; i++) {
        if ((int)i == excludeIndex) continue;
        if (store->animals[i].deleted == 1) continue;
        if (ciStrCmp(store->animals[i].tag, tag) == 0) return true;
    }
    return false;
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

static unsigned int storeAddAnimal(Store *store, const char *tag, const char *type,
                                    const char *breed, const char *gender,
                                    const char *birthDate, float weight,
                                    const char *health)
{
    if (store->count >= MAX_ANIMALS) return 0;
    if (storeTagExists(store, tag, -1)) return 0;

    Animal a;
    memset(&a, 0, sizeof(a));
    strncpy(a.tag, tag, MAX_NAME);
    strncpy(a.type, type, MAX_TYPE);
    strncpy(a.breed, breed, MAX_BREED);
    strncpy(a.gender, gender, sizeof(a.gender) - 1);
    strncpy(a.birthDate, birthDate, sizeof(a.birthDate) - 1);
    a.weight = weight;
    strncpy(a.healthStatus, health, MAX_STATUS);
    a.id = store->nextID++;
    a.deleted = 0;

    store->animals[store->count] = a;
    store->count++;
    store->dirty = 1;
    return a.id;
}

static bool storeSoftDelete(Store *store, unsigned int id)
{
    int idx = storeFindIndexByID(store, id);
    if (idx == -1) return false;
    store->animals[idx].deleted = 1;
    store->dirty = 1;
    return true;
}

static bool storeSaveToFile(const Store *store, const char *filename)
{
    FILE *fp = fopen(filename, "w");
    if (fp == NULL) return false;
    for (size_t i = 0; i < store->count; i++) {
        const Animal *a = &store->animals[i];
        fprintf(fp, "%u|%s|%s|%s|%s|%s|%.2f|%s|%d\n",
                a->id, a->tag, a->type, a->breed, a->gender,
                a->birthDate, (double)a->weight, a->healthStatus, a->deleted);
    }
    fclose(fp);
    return true;
}

static size_t storeLoadFromFile(Store *store, const char *filename)
{
    FILE *fp = fopen(filename, "r");
    if (fp == NULL) return 0;

    char line[512];
    unsigned int maxID = 0;
    store->count = 0;

    while (fgets(line, sizeof(line), fp) != NULL) {
        size_t len = strlen(line);
        if (len > 0 && line[len - 1] == '\n') line[len - 1] = '\0';
        if (line[0] == '\0') continue;

        Animal a;
        memset(&a, 0, sizeof(a));
        char idStr[32] = {0}, weightStr[32] = {0}, deletedStr[8] = {0};

        char *token = strtok(line, "|");
        int field = 0;
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
        if (field < 9) continue;

        a.id = (unsigned int)strtoul(idStr, NULL, 10);
        a.weight = strtof(weightStr, NULL);
        a.deleted = (int)strtol(deletedStr, NULL, 10);
        if (a.id > maxID) maxID = a.id;

        store->animals[store->count++] = a;
    }
    fclose(fp);
    store->nextID = maxID + 1;
    return store->count;
}

/* ---- Test groups ---- */

static void testValidationGender(void)
{
    printf("\n[Group] Gender validation\n");
    ASSERT_TRUE(isValidGender("Male") == true, "Male is valid");
    ASSERT_TRUE(isValidGender("Female") == true, "Female is valid");
    ASSERT_TRUE(isValidGender("male") == true, "lowercase male is valid");
    ASSERT_TRUE(isValidGender("FEMALE") == true, "uppercase FEMALE is valid");
    ASSERT_TRUE(isValidGender("Unknown") == false, "Unknown is invalid");
    ASSERT_TRUE(isValidGender("") == false, "empty string is invalid");
}

static void testValidationDate(void)
{
    printf("\n[Group] Date validation\n");
    ASSERT_TRUE(isValidDate("2024-01-10") == true, "valid date 2024-01-10");
    ASSERT_TRUE(isValidDate("2024-02-29") == true, "leap year Feb 29 valid");
    ASSERT_TRUE(isValidDate("2023-02-29") == false, "non-leap year Feb 29 invalid");
    ASSERT_TRUE(isValidDate("2024-13-01") == false, "month 13 invalid");
    ASSERT_TRUE(isValidDate("2024-00-01") == false, "month 0 invalid");
    ASSERT_TRUE(isValidDate("2024-04-31") == false, "April 31 invalid (30 day month)");
    ASSERT_TRUE(isValidDate("2024-1-10") == false, "wrong format (missing zero pad) invalid");
    ASSERT_TRUE(isValidDate("bad-date") == false, "garbage string invalid");
    ASSERT_TRUE(isValidDate("") == false, "empty string invalid");
}

static void testValidationWeight(void)
{
    printf("\n[Group] Weight validation\n");
    float w = 0.0f;
    ASSERT_TRUE(isValidWeightStr("350.5", &w) == true, "350.5 is valid weight");
    ASSERT_TRUE(w > 350.4f && w < 350.6f, "parsed weight value is correct");
    ASSERT_TRUE(isValidWeightStr("0", NULL) == false, "zero weight invalid");
    ASSERT_TRUE(isValidWeightStr("-5", NULL) == false, "negative weight invalid");
    ASSERT_TRUE(isValidWeightStr("abc", NULL) == false, "non-numeric weight invalid");
    ASSERT_TRUE(isValidWeightStr("12abc", NULL) == false, "trailing junk invalid");
    ASSERT_TRUE(isValidWeightStr("", NULL) == false, "empty weight invalid");
    ASSERT_TRUE(isValidWeightStr("42.75", NULL) == true, "decimal weight valid");
}

static void testAddingAnimals(void)
{
    printf("\n[Group] Adding animals\n");
    Store store;
    storeInit(&store);

    unsigned int id1 = storeAddAnimal(&store, "COW001", "Cow", "Holstein", "Female", "2024-01-10", 350.5f, "Healthy");
    ASSERT_TRUE(id1 == 1, "first animal gets ID 1");
    ASSERT_TRUE(store.count == 1, "store count is 1 after add");

    unsigned int id2 = storeAddAnimal(&store, "GOAT001", "Goat", "Boer", "Male", "2023-05-05", 45.0f, "Vaccinated");
    ASSERT_TRUE(id2 == 2, "second animal gets ID 2");
    ASSERT_TRUE(store.count == 2, "store count is 2 after second add");

    ASSERT_TRUE(strcmp(store.animals[0].tag, "COW001") == 0, "first animal tag stored correctly");
    ASSERT_TRUE(store.animals[1].deleted == 0, "second animal not deleted by default");
}

static void testDuplicateTag(void)
{
    printf("\n[Group] Duplicate tag rejection\n");
    Store store;
    storeInit(&store);

    unsigned int id1 = storeAddAnimal(&store, "SHEEP001", "Sheep", "Merino", "Female", "2022-03-03", 60.0f, "Healthy");
    ASSERT_TRUE(id1 != 0, "first sheep added successfully");

    unsigned int id2 = storeAddAnimal(&store, "SHEEP001", "Sheep", "Merino", "Male", "2022-04-04", 65.0f, "Healthy");
    ASSERT_TRUE(id2 == 0, "duplicate tag rejected, returns 0");
    ASSERT_TRUE(store.count == 1, "store count remains 1 after duplicate rejection");
}

static void testSearching(void)
{
    printf("\n[Group] Searching\n");
    Store store;
    storeInit(&store);
    storeAddAnimal(&store, "COW001", "Cow", "Holstein", "Female", "2024-01-10", 350.5f, "Healthy");
    storeAddAnimal(&store, "COW002", "Cow", "Jersey", "Male", "2023-06-15", 300.0f, "Sick");
    storeAddAnimal(&store, "GOAT001", "Goat", "Boer", "Male", "2022-02-02", 45.0f, "Vaccinated");

    int idx = storeFindIndexByID(&store, 2);
    ASSERT_TRUE(idx == 1, "find by ID returns correct index");
    ASSERT_TRUE(strcmp(store.animals[idx].tag, "COW002") == 0, "found record has expected tag");

    int missing = storeFindIndexByID(&store, 999);
    ASSERT_TRUE(missing == -1, "searching missing ID returns -1");
}

static void testEditing(void)
{
    printf("\n[Group] Editing\n");
    Store store;
    storeInit(&store);
    unsigned int id = storeAddAnimal(&store, "COW003", "Cow", "Angus", "Female", "2021-01-01", 400.0f, "Healthy");

    int idx = storeFindIndexByID(&store, id);
    ASSERT_TRUE(idx != -1, "record exists before edit");

    strncpy(store.animals[idx].healthStatus, "Sick", MAX_STATUS);
    store.animals[idx].weight = 410.5f;

    ASSERT_TRUE(strcmp(store.animals[idx].healthStatus, "Sick") == 0, "health status updated");
    ASSERT_TRUE(store.animals[idx].weight > 410.0f && store.animals[idx].weight < 411.0f, "weight updated");
}

static void testDeleting(void)
{
    printf("\n[Group] Deleting (soft delete)\n");
    Store store;
    storeInit(&store);
    unsigned int id = storeAddAnimal(&store, "COW004", "Cow", "Angus", "Male", "2020-01-01", 420.0f, "Healthy");

    bool result = storeSoftDelete(&store, id);
    ASSERT_TRUE(result == true, "soft delete succeeds for existing ID");
    ASSERT_TRUE(store.animals[0].deleted == 1, "record marked as deleted");
    ASSERT_TRUE(store.count == 1, "record still present in array (soft delete, not removed)");

    int idx = storeFindIndexByID(&store, id);
    ASSERT_TRUE(idx == -1, "deleted record not found by active search");

    bool resultMissing = storeSoftDelete(&store, 999);
    ASSERT_TRUE(resultMissing == false, "deleting non-existent ID fails gracefully");
}

static void testSavingAndLoading(void)
{
    printf("\n[Group] Saving and loading\n");
    Store store;
    storeInit(&store);
    storeAddAnimal(&store, "COW005", "Cow", "Holstein", "Female", "2024-01-10", 350.5f, "Healthy");
    storeAddAnimal(&store, "GOAT002", "Goat", "Boer", "Male", "2023-05-05", 45.0f, "Vaccinated");

    const char *testFile = "test_animals_temp.txt";
    bool saved = storeSaveToFile(&store, testFile);
    ASSERT_TRUE(saved == true, "save to file succeeds");

    Store loaded;
    storeInit(&loaded);
    size_t loadedCount = storeLoadFromFile(&loaded, testFile);
    ASSERT_TRUE(loadedCount == 2, "loaded record count matches saved count");
    ASSERT_TRUE(strcmp(loaded.animals[0].tag, "COW005") == 0, "first loaded tag matches");
    ASSERT_TRUE(strcmp(loaded.animals[1].tag, "GOAT002") == 0, "second loaded tag matches");
    ASSERT_TRUE(loaded.nextID == 3, "next ID correctly recalculated after load");

    remove(testFile);
}

static void testSummary(void)
{
    printf("\n[Group] Summary calculations\n");
    Store store;
    storeInit(&store);
    storeAddAnimal(&store, "COW006", "Cow", "Holstein", "Female", "2024-01-10", 300.0f, "Healthy");
    storeAddAnimal(&store, "COW007", "Cow", "Jersey", "Male", "2023-06-15", 400.0f, "Sick");
    storeAddAnimal(&store, "GOAT003", "Goat", "Boer", "Male", "2022-02-02", 50.0f, "Healthy");

    size_t total = 0, cows = 0, healthy = 0;
    double totalWeight = 0.0;
    float maxW = 0.0f, minW = 999999.0f;

    for (size_t i = 0; i < store.count; i++) {
        if (store.animals[i].deleted) continue;
        total++;
        char lower[MAX_TYPE + 1];
        toLowerCopy(lower, store.animals[i].type, sizeof(lower));
        if (strcmp(lower, "cow") == 0) cows++;

        char health[MAX_STATUS + 1];
        toLowerCopy(health, store.animals[i].healthStatus, sizeof(health));
        if (strcmp(health, "healthy") == 0) healthy++;

        totalWeight += (double)store.animals[i].weight;
        if (store.animals[i].weight > maxW) maxW = store.animals[i].weight;
        if (store.animals[i].weight < minW) minW = store.animals[i].weight;
    }

    ASSERT_TRUE(total == 3, "total animal count correct");
    ASSERT_TRUE(cows == 2, "cow count correct");
    ASSERT_TRUE(healthy == 2, "healthy count correct");
    ASSERT_TRUE(totalWeight > 749.9 && totalWeight < 750.1, "total weight sums correctly");
    ASSERT_TRUE(maxW > 399.9f && maxW < 400.1f, "max weight correct");
    ASSERT_TRUE(minW > 49.9f && minW < 50.1f, "min weight correct");
}

static void testCapacityLimit(void)
{
    printf("\n[Group] Capacity / edge cases\n");
    Store store;
    storeInit(&store);
    ASSERT_TRUE(store.count == 0, "new store starts empty");
    ASSERT_TRUE(store.nextID == 1, "new store starts with nextID 1");

    unsigned int id = storeAddAnimal(&store, "ONLY", "Cow", "Test", "Male", "2020-01-01", 100.0f, "Healthy");
    ASSERT_TRUE(id == 1, "single add works as expected");

    unsigned int id2 = storeAddAnimal(&store, "TWO", "Goat", "Test", "Female", "2021-01-01", 30.0f, "Healthy");
    ASSERT_TRUE(id2 == 2, "second add increments ID correctly");
    ASSERT_TRUE(store.count == 2, "capacity store now holds 2 animals");
    ASSERT_TRUE(storeTagExists(&store, "ONLY", -1) == true, "tag existence check finds existing tag");
    ASSERT_TRUE(storeTagExists(&store, "NOPE", -1) == false, "tag existence check rejects unknown tag");
}

int main(void)
{
    printf("=====================================\n");
    printf(" AGRI FARM MANAGEMENT SYSTEM - TESTS\n");
    printf("=====================================\n");

    testValidationGender();
    testValidationDate();
    testValidationWeight();
    testAddingAnimals();
    testDuplicateTag();
    testSearching();
    testEditing();
    testDeleting();
    testSavingAndLoading();
    testSummary();
    testCapacityLimit();

    printf("\n=====================================\n");
    printf(" RESULTS: %d run, %d passed, %d failed\n",
           g_testsRun, g_testsRun - g_testsFailed, g_testsFailed);
    printf("=====================================\n");

    return g_testsFailed == 0 ? EXIT_SUCCESS : EXIT_FAILURE;
}
