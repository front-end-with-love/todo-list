const { test, expect } = require("@playwright/test");

const STORAGE_KEY = "todo-list.tasks.v1";

const input = (page) => page.getByLabel("Новая задача");
const addButton = (page) => page.getByRole("button", { name: "Добавить" });
const status = (page) =>
  page.getByRole("status", { includeHidden: true });
const items = (page) => page.getByRole("listitem");
const checkbox = (page, text) => page.getByRole("checkbox", { name: text });
const deleteButton = (page, text) =>
  page.getByRole("button", { name: `Удалить задачу: ${text}`, exact: true });

async function addTask(page, text, { viaButton = false } = {}) {
  await input(page).fill(text);
  if (viaButton) {
    await addButton(page).click();
  } else {
    await input(page).press("Enter");
  }
}

function readStorage(page) {
  return page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
}

const consoleProblems = new WeakMap();

// Слушатели подключаются в beforeEach, зарегистрированном до навигации:
// фикстуры создаются позже хуков, поэтому так ловятся ошибки первого открытия,
// а не только перезагрузки.
test.beforeEach(async ({ page }) => {
  const problems = [];
  consoleProblems.set(page, problems);
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      problems.push(message.text());
    }
  });
});

// Каждый тест получает новый BrowserContext, поэтому localStorage пуст:
// достаточно одного перехода, дополнительная очистка хранилища не нужна.
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("приложение загружается без ошибок в консоли", async ({ page }) => {
  await expect(
    page.getByRole("heading", { level: 1, name: "Список задач" }),
  ).toBeVisible();
  await expect(input(page)).toBeVisible();
  await expect(addButton(page)).toBeVisible();
  await expect(page.getByText("Пока нет задач. Добавьте первую.")).toBeVisible();
  expect(consoleProblems.get(page)).toEqual([]);
});

test("пустая задача не добавляется и фокус возвращается в поле", async ({
  page,
}) => {
  await input(page).focus();
  await input(page).press("Enter");

  await expect(items(page)).toHaveCount(0);
  await expect(status(page)).toHaveText("Введите текст задачи.");
  await expect(input(page)).toBeFocused();

  await input(page).fill("   ");
  await addButton(page).click();

  await expect(items(page)).toHaveCount(0);
  await expect(input(page)).toBeFocused();
});

test("пользователь может добавить задачу через Enter", async ({ page }) => {
  await addTask(page, "Купить молоко");

  await expect(items(page)).toHaveCount(1);
  await expect(items(page)).toHaveText("Купить молоко");
  await expect(input(page)).toHaveValue("");
  await expect(input(page)).toBeFocused();
  await expect(status(page)).toHaveText("Задача добавлена.");
});

test("фокус возвращается в поле после добавления кнопкой", async ({ page }) => {
  await addTask(page, "Позвонить в банк", { viaButton: true });

  await expect(items(page)).toHaveCount(1);
  await expect(input(page)).toBeFocused();
  await expect(input(page)).toHaveValue("");
});

test("пользователь может добавить несколько задач", async ({ page }) => {
  await addTask(page, "Первая задача");
  await addTask(page, "Вторая задача");
  await addTask(page, "Третья задача");

  await expect(items(page)).toHaveCount(3);
  await expect(items(page).nth(0)).toHaveText("Первая задача");
  await expect(items(page).nth(1)).toHaveText("Вторая задача");
  await expect(items(page).nth(2)).toHaveText("Третья задача");
});

test("пользователь может отметить задачу выполненной", async ({ page }) => {
  await addTask(page, "Сдать отчёт");

  await checkbox(page, "Сдать отчёт").check();

  await expect(checkbox(page, "Сдать отчёт")).toBeChecked();
  await expect(page.getByText("Сдать отчёт", { exact: true })).toHaveCSS(
    "text-decoration-line",
    "line-through",
  );
});

test("пользователь может вернуть задачу в активное состояние", async ({
  page,
}) => {
  await addTask(page, "Сдать отчёт");
  await checkbox(page, "Сдать отчёт").check();
  await checkbox(page, "Сдать отчёт").uncheck();

  await expect(checkbox(page, "Сдать отчёт")).not.toBeChecked();
  await expect(page.getByText("Сдать отчёт", { exact: true })).not.toHaveCSS(
    "text-decoration-line",
    "line-through",
  );
});

test("удаление удаляет только выбранную задачу", async ({ page }) => {
  await addTask(page, "Первая");
  await addTask(page, "Вторая");
  await addTask(page, "Третья");

  await deleteButton(page, "Вторая").click();

  await expect(items(page)).toHaveCount(2);
  await expect(items(page)).toHaveText(["Первая", "Третья"]);
  await expect(status(page)).toHaveText("Задача удалена.");
});

test("у каждой кнопки удаления индивидуальное доступное имя", async ({
  page,
}) => {
  await addTask(page, "Первая");
  await addTask(page, "Вторая");

  await expect(deleteButton(page, "Первая")).toHaveCount(1);
  await expect(deleteButton(page, "Вторая")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Удалить задачу", exact: true }),
  ).toHaveCount(0);
});

test("пустой список задач убирается из DOM, пока не появятся задачи", async ({ page }) => {
  await expect(page.locator("#task-list")).toHaveCount(0);
  await expect(page.getByText("Пока нет задач. Добавьте первую.")).toBeVisible();

  await addTask(page, "Первая задача");

  await expect(page.locator("#task-list")).toHaveCount(1);
  await expect(page.locator("#task-list img")).toHaveCount(0);
  await expect(page.locator("#task-list")).toHaveText(["Первая задача"]);
  await expect(page.getByText("Пока нет задач. Добавьте первую.")).toBeHidden();
});

test("список и статусы сохраняются после перезагрузки", async ({ page }) => {
  await addTask(page, "Купить хлеб");
  await addTask(page, "Вымыть посуду");
  await checkbox(page, "Вымыть посуду").check();

  await page.reload();

  await expect(items(page)).toHaveCount(2);
  await expect(items(page)).toHaveText(["Купить хлеб", "Вымыть посуду"]);
  await expect(checkbox(page, "Вымыть посуду")).toBeChecked();
  await expect(checkbox(page, "Купить хлеб")).not.toBeChecked();
  await expect(status(page)).toBeHidden();
});

test("пустое состояние показывается, когда задач нет", async ({ page }) => {
  const emptyState = page.getByText("Пока нет задач. Добавьте первую.");

  await expect(emptyState).toBeVisible();
  await addTask(page, "Единственная");
  await expect(emptyState).toBeHidden();
  await deleteButton(page, "Единственная").click();
  await expect(emptyState).toBeVisible();
});

test("после удаления последней задачи список убирается из DOM", async ({
  page,
}) => {
  await addTask(page, "Первая");
  await addTask(page, "Вторая");

  await expect(page.locator("#task-list")).toHaveCount(1);

  await deleteButton(page, "Первая").click();
  await expect(page.locator("#task-list")).toHaveCount(1);
  await expect(page.locator("#task-list")).toHaveText(["Вторая"]);

  await deleteButton(page, "Вторая").click();

  await expect(page.locator("#task-list")).toHaveCount(0);
  await expect(items(page)).toHaveCount(0);
  await expect(page.getByText("Пока нет задач. Добавьте первую.")).toBeVisible();
  await expect(input(page)).toBeFocused();
});

test.describe("повреждённые данные", () => {
  test("невалидный JSON не роняет приложение и не перезаписывается", async ({
    page,
  }) => {
    const broken = '{"version":1,"tasks":[';

    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key, value),
      [STORAGE_KEY, broken],
    );
    await page.goto("/");

    await expect(items(page)).toHaveCount(0);
    await expect(status(page)).toContainText("повреждены");
    await expect(
      page.getByText("Пока нет задач. Добавьте первую."),
    ).toBeVisible();
    await expect.poll(() => readStorage(page)).toBe(broken);
  });

  test("несовместимая версия схемы не роняет приложение", async ({ page }) => {
    const incompatible = JSON.stringify({
      version: 2,
      tasks: [{ id: "a", text: "Старая задача", completed: false }],
    });

    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key, value),
      [STORAGE_KEY, incompatible],
    );
    await page.goto("/");

    await expect(items(page)).toHaveCount(0);
    await expect(status(page)).toContainText("повреждены");
    await expect.poll(() => readStorage(page)).toBe(incompatible);
  });

  test("валидные задачи остаются в памяти при частичном повреждении", async ({
    page,
  }) => {
    const partiallyBroken = JSON.stringify({
      version: 1,
      tasks: [
        { id: "id-1", text: "Целая задача", completed: false },
        { id: "", text: "Без идентификатора", completed: false },
        { id: "id-1", text: "Дубликат идентификатора", completed: true },
        { id: "id-2", text: "   ", completed: false },
      ],
    });

    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key, value),
      [STORAGE_KEY, partiallyBroken],
    );
    await page.goto("/");

    await expect(items(page)).toHaveCount(1);
    await expect(items(page)).toHaveText("Целая задача");
    await expect(status(page)).toContainText("повреждены");

    // До первого действия пользователя повреждённое значение не перезаписано.
    await expect.poll(() => readStorage(page)).toBe(partiallyBroken);

    await addTask(page, "Новая задача");
    await expect(items(page)).toHaveCount(2);

    const saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)),
      STORAGE_KEY,
    );
    expect(saved.version).toBe(1);
    expect(saved.tasks.map((task) => task.text)).toEqual([
      "Целая задача",
      "Новая задача",
    ]);
  });
});

test("без crypto.randomUUID задача не создаётся, показывается сообщение", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, "randomUUID", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });
  await page.goto("/");

  await addTask(page, "Не должна появиться");

  await expect(items(page)).toHaveCount(0);
  await expect(status(page)).toContainText("HTTPS");
  await expect(input(page)).toBeFocused();
});

test("ошибка записи не теряет задачи текущей сессии", async ({ page }) => {
  await page.addInitScript((key) => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) {
        throw new DOMException("Превышена квота", "QuotaExceededError");
      }
      return setItem.call(this, name, value);
    };
  }, STORAGE_KEY);
  await page.goto("/");

  await addTask(page, "Без сохранения");

  await expect(items(page)).toHaveCount(1);
  await expect(status(page)).toContainText("Не удалось сохранить изменения");
});

test("ошибка чтения хранилища не роняет приложение, сессия остаётся рабочей", async ({
  page,
}) => {
  const problems = [];
  page.on("pageerror", (error) => problems.push(error.message));

  await page.addInitScript((key) => {
    const getItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (name) {
      if (name === key) {
        throw new DOMException("Доступ к хранилищу запрещён", "SecurityError");
      }
      return getItem.call(this, name);
    };
  }, STORAGE_KEY);
  await page.goto("/");

  await expect(items(page)).toHaveCount(0);
  await expect(status(page)).toContainText("Хранилище недоступно");

  await addTask(page, "Задача без чтения");
  await expect(items(page)).toHaveCount(1);
  await expect(status(page)).toHaveText("Задача добавлена.");

  await checkbox(page, "Задача без чтения").check();
  await expect(checkbox(page, "Задача без чтения")).toBeChecked();

  await deleteButton(page, "Задача без чтения").click();
  await expect(items(page)).toHaveCount(0);
  await expect(
    page.getByText("Пока нет задач. Добавьте первую."),
  ).toBeVisible();

  expect(problems).toEqual([]);
});

test("текст задачи выводится как текст, а не как HTML", async ({ page }) => {
  const payload = '<img src=x onerror="window.__xss = true">';

  await addTask(page, payload);

  await expect(page.getByText(payload, { exact: true })).toBeVisible();
  await expect(page.locator("#task-list img")).toHaveCount(0);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
});

test.describe("типографика", () => {
  test("заголовок и подпись поля соответствуют дизайн-системе", async ({
    page,
  }) => {
    const headingStyle = await page
      .getByRole("heading", { level: 1, name: "Список задач" })
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
        };
      });

    expect(headingStyle.fontSize).toBe("28px");
    expect(headingStyle.fontWeight).toBe("600");
    // Трекинг -0.02em от 28 px и интерлиньяж 1.15 от 28 px.
    expect(Number.parseFloat(headingStyle.letterSpacing)).toBeCloseTo(-0.56, 2);
    expect(Number.parseFloat(headingStyle.lineHeight)).toBeCloseTo(32.2, 1);

    const labelStyle = await page
      .locator(".task-form__label")
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          textTransform: style.textTransform,
        };
      });

    expect(labelStyle.fontSize).toBe("12px");
    expect(labelStyle.fontWeight).toBe("600");
    expect(labelStyle.textTransform).toBe("uppercase");
  });

  test("прописная подпись не меняет текст в DOM и доступное имя поля", async ({
    page,
  }) => {
    const domText = await page
      .locator(".task-form__label")
      .evaluate((element) => element.textContent.trim());

    expect(domText).toBe("Новая задача");
    await expect(input(page)).toHaveAccessibleName("Новая задача");
  });

  test("шрифт грузится локально, сторонних запросов нет", async ({ page }) => {
    const requests = [];
    page.on("request", (request) => requests.push(request.url()));

    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const origin = new URL(page.url()).origin;
    const foreign = requests.filter((url) => !url.startsWith(origin));
    expect(foreign).toEqual([]);

    const bodyFont = await page.evaluate(
      () => getComputedStyle(document.body).fontFamily,
    );
    expect(bodyFont).toContain("Inter");

    // Проверяем кириллический сабсет: латинский может не загружаться,
    // пока в интерфейсе нет латинских символов.
    expect(
      await page.evaluate(() => document.fonts.check("16px Inter", "Список задач")),
    ).toBe(true);
    expect(
      await page.evaluate(() =>
        document.fonts.check("600 16px Inter", "Список задач"),
      ),
    ).toBe(true);
  });

  test("подключены отдельные файлы для каждого начертания", async ({ page }) => {
    const fontFiles = [];
    page.on("request", (request) => {
      if (request.url().endsWith(".woff2")) {
        fontFiles.push(request.url().split("/").pop());
      }
    });

    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    // Начертания 400, 500 и 600 должны приходить разными файлами: иначе
    // браузер подставит ближайшее доступное начертание и дизайн поменяется.
    expect(fontFiles).toContain("inter-400-cyrillic.woff2");
    expect(fontFiles).toContain("inter-500-cyrillic.woff2");
    expect(fontFiles).toContain("inter-600-cyrillic.woff2");

    // Для русского интерфейса латинский сабсет не нужен.
    expect(fontFiles.filter((file) => file.includes("-latin."))).toEqual([]);
  });
});

for (const width of [320, 360, 1280]) {
  test.describe(`viewport ${width}×640`, () => {
    test.use({ viewport: { width, height: 640 } });

    test("нет переполнения, зоны нажатия не меньше 44×44", async ({ page }) => {
      const longText =
        "Очень-длинная-задача-без-пробелов-".repeat(4) + "х".repeat(160);
      await addTask(page, longText);

      const toggleBox = await page.locator(".task-item__toggle").boundingBox();
      const removeBox = await deleteButton(page, longText).boundingBox();

      expect(toggleBox).not.toBeNull();
      expect(removeBox).not.toBeNull();
      // Сравниваем исходные значения: округление скрыло бы 43,6 px.
      expect(toggleBox.width).toBeGreaterThanOrEqual(44);
      expect(toggleBox.height).toBeGreaterThanOrEqual(44);
      expect(removeBox.width).toBeGreaterThanOrEqual(44);
      expect(removeBox.height).toBeGreaterThanOrEqual(44);

      const gap = removeBox.x - (toggleBox.x + toggleBox.width);
      expect(gap).toBeGreaterThanOrEqual(8);

      const hasHorizontalOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  });
}

// Увеличение корневого font-size имитирует text-only zoom по WCAG 1.4.4:
// растут rem-размеры текста, но не px-размеры зон нажатия и карточки.
// Это не браузерное масштабирование всего вьюпорта, поэтому проверяется
// reflow при увеличенном тексте, а не поведение страницы при browser zoom.
test.describe("текст, увеличенный до 200%", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("нет горизонтального переполнения, текст переносится, контролы доступны", async ({
    page,
  }) => {
    const text = "Увеличенный текст задачи";
    await addTask(page, text);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    const textMetrics = await page
      .locator(".task-item__text")
      .evaluate((element) => ({
        clipped: element.scrollWidth > element.clientWidth + 1,
        lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
        height: element.getBoundingClientRect().height,
      }));

    expect(textMetrics.clipped).toBe(false);
    expect(textMetrics.height).toBeGreaterThan(textMetrics.lineHeight);

    await expect(addButton(page)).toBeVisible();
    await expect(checkbox(page, text)).toBeVisible();
    await expect(deleteButton(page, text)).toBeVisible();
  });
});

test("основные действия доступны с клавиатуры", async ({ page }) => {
  const taskCheckbox = checkbox(page, "Позвонить в банк");

  await input(page).focus();
  await page.keyboard.type("Позвонить в банк");
  await page.keyboard.press("Enter");

  await expect(items(page)).toHaveCount(1);
  await expect(input(page)).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(addButton(page)).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(taskCheckbox).toBeFocused();
  await page.keyboard.press("Space");
  await expect(taskCheckbox).toBeChecked();
  await expect(taskCheckbox).toBeFocused();

  await page.keyboard.press("Tab");
  const remove = deleteButton(page, "Позвонить в банк");
  await expect(remove).toBeFocused();
  expect(
    await remove.evaluate((element) => getComputedStyle(element).outlineStyle),
  ).toBe("solid");

  await page.keyboard.press("Enter");
  await expect(items(page)).toHaveCount(0);
  await expect(input(page)).toBeFocused();
});

test("фокус после удаления идёт на следующую, предыдущую или в поле", async ({
  page,
}) => {
  await addTask(page, "Первая");
  await addTask(page, "Вторая");
  await addTask(page, "Третья");

  await deleteButton(page, "Вторая").click();
  await expect(checkbox(page, "Третья")).toBeFocused();

  await deleteButton(page, "Третья").click();
  await expect(checkbox(page, "Первая")).toBeFocused();

  await deleteButton(page, "Первая").click();
  await expect(input(page)).toBeFocused();
  await expect(items(page)).toHaveCount(0);
});
