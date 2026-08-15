SELECT * FROM tiket;

SELECT *
FROM tiket
WHERE status = 'open';

SELECT
    tiket.id,
    tiket.judul,
    tiket.status,
    akun.nama
FROM tiket
JOIN akun
    ON tiket.id_akun = akun.id;

UPDATE tiket
SET status = 'selesai'
WHERE id =d1;

DELETE FROM tiket
WHERE id = 1;
