# SHIPÁ — реальные видео и видеоотзывы (06.11.2026)

## Что изменено

- **Главная → Атмосфера банных домов**: 8 роликов YouTube Shorts вместо демонстрационных изображений с фиктивной кнопкой Play.
- **Главная → Видеоотзывы**: 5 YouTube Shorts от пользователей, вместо иллюстративных карточек с вымышленными именами.
- **Страница «Отзывы»**: добавлена отдельная карусель пяти настоящих видеоотзывов до текстовых отзывов.
- Каждая карточка открывает настоящую вертикальную iframe-вставку через `www.youtube-nocookie.com` только после нажатия.
- При закрытии диалог размонтируется и воспроизведение останавливается. Поддержаны Escape, возврат фокуса и блокировка прокрутки страницы на время воспроизведения.
- Есть ссылка «Открыть на YouTube» на случай ограничений встраивания.
- Казахские и русские подписи для роликов и элементов плеера.
- Не приписываем роликам конкретные имена, дома или содержание, поскольку по ссылкам эти сведения нельзя достоверно установить из текущего окружения.

## Ссылки / порядок отображения

### Атмосфера (8)
1. https://www.youtube.com/shorts/aJ-setkE8K4
2. https://www.youtube.com/shorts/18I1z2_c6WI
3. https://www.youtube.com/shorts/30zbnPSyyh8
4. https://www.youtube.com/shorts/fPm4bVECuiM
5. https://www.youtube.com/shorts/IRFIUWDYoJE
6. https://www.youtube.com/shorts/Vbe0zz7YYzc
7. https://www.youtube.com/shorts/RUfCTHoyLqk
8. https://www.youtube.com/shorts/Exm4anJyb4Y

### Видеоотзывы (5)
1. https://www.youtube.com/shorts/N8_4y0uMMss
2. https://www.youtube.com/shorts/4PqFCETg_XE
3. https://www.youtube.com/shorts/WfFJD7Noc9M
4. https://www.youtube.com/shorts/eNn3Z3bZt9c
5. https://www.youtube.com/shorts/-6B9CUF9wrI

## Технические детали

- Файлы: `index.html`, `ux-tests/real-youtube-videos.test.cjs`, `i18n-tests/kz-visible-copy-regression.test.cjs`.
- Внешние обложки: `https://i.ytimg.com/vi/<id>/hqdefault.jpg`.
- Плеер: `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&playsinline=1&rel=0`.
- Видео **не скачиваются и не копируются** в архив: для просмотра требуется подключение к YouTube.
- Полноценная проверка воспроизведения и доступности каждого видео в Chromium не состоялась из-за ограничений среды (локальный HTTP был заблокирован, YouTube throttled). Если у ролика запрещено встраивание, используйте внешнюю ссылку в диалоге.

## Проверки

- 80/80 Node-автотестов прошли.
- JavaScript основного приложения проверен через `node --check`.
- Сохранены ранее внесённые изменения: «← Все дома» над галереей, управление фото только стрелками, правки описаний и RU/KZ.
