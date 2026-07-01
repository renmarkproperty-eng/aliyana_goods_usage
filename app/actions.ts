"use server";

export async function createPengambilanBarang(formData: FormData) {
  const pengambilanBarang = {
    tanggal: formData.get("tanggal"),
    departemen: formData.get("departemen"),
    shift: formData.get("shift"),
    nama_pengambil: formData.get("nama_pengambil"),
  };

  const catatanIds = formData.getAll("catatan_id");
  const namaBarangs = formData.getAll("nama_barang");
  const satuans = formData.getAll("satuan");
  const jumlahDiambils = formData.getAll("jumlah_diambil");
  const jumlahTerpakais = formData.getAll("jumlah_terpakai");
  const digunakanUntuks = formData.getAll("digunakan_untuk");
  const menus = formData.getAll("menu");
  const keterangans = formData.getAll("keterangan");

  const detailPengambilanBarang = namaBarangs.map((namaBarang, index) => ({
    catatan_id: catatanIds[index],
    nama_barang: namaBarang,
    satuan: satuans[index],
    jumlah_diambil: jumlahDiambils[index],
    digunakan_untuk: digunakanUntuks[index],
    menu: menus[index],
    jumlah_terpakai: jumlahTerpakais[index],
    keterangan: keterangans[index],
  }));

  void pengambilanBarang;
  void detailPengambilanBarang;
}
