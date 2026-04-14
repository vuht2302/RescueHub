using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class nguoi_dung
{
    public Guid id { get; set; }

    public Guid? to_chuc_id { get; set; }

    public Guid? don_vi_id { get; set; }

    public string? username { get; set; }

    public string? phone { get; set; }

    public string? email { get; set; }

    public string? password_hash { get; set; }

    public string display_name { get; set; } = null!;

    public string? avatar_url { get; set; }

    public string status_code { get; set; } = null!;

    public DateTime? last_login_at { get; set; }

    public int failed_login_count { get; set; }

    public bool is_active { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<ai_goi_y> ai_goi_ies { get; set; } = new List<ai_goi_y>();

    public virtual ICollection<ai_nhiem_vu> ai_nhiem_vus { get; set; } = new List<ai_nhiem_vu>();

    public virtual ICollection<bao_cao_hien_truong> bao_cao_hien_truongs { get; set; } = new List<bao_cao_hien_truong>();

    public virtual cong_dan? cong_dan { get; set; }

    public virtual ICollection<danh_gia_su_co> danh_gia_su_cos { get; set; } = new List<danh_gia_su_co>();

    public virtual ICollection<diem_cuu_tro> diem_cuu_tros { get; set; } = new List<diem_cuu_tro>();

    public virtual ICollection<doi_cuu_ho> doi_cuu_hos { get; set; } = new List<doi_cuu_ho>();

    public virtual don_vi? don_vi { get; set; }

    public virtual ICollection<kho> khos { get; set; } = new List<kho>();

    public virtual ICollection<ky_nang_thanh_vien> ky_nang_thanh_viens { get; set; } = new List<ky_nang_thanh_vien>();

    public virtual ICollection<lenh_dieu_chuyen_kho> lenh_dieu_chuyen_khoapproved_byNavigations { get; set; } = new List<lenh_dieu_chuyen_kho>();

    public virtual ICollection<lenh_dieu_chuyen_kho> lenh_dieu_chuyen_khorequested_byNavigations { get; set; } = new List<lenh_dieu_chuyen_kho>();

    public virtual ICollection<lich_su_chuyen_doi> lich_su_chuyen_dois { get; set; } = new List<lich_su_chuyen_doi>();

    public virtual ICollection<lich_su_trang_thai_nhiem_vu> lich_su_trang_thai_nhiem_vus { get; set; } = new List<lich_su_trang_thai_nhiem_vu>();

    public virtual ICollection<lich_su_trang_thai_phuong_tien> lich_su_trang_thai_phuong_tiens { get; set; } = new List<lich_su_trang_thai_phuong_tien>();

    public virtual ICollection<lich_su_trang_thai_su_co> lich_su_trang_thai_su_cos { get; set; } = new List<lich_su_trang_thai_su_co>();

    public virtual ICollection<lien_ket_su_co> lien_ket_su_cos { get; set; } = new List<lien_ket_su_co>();

    public virtual ICollection<nguoi_dung_vai_tro> nguoi_dung_vai_tros { get; set; } = new List<nguoi_dung_vai_tro>();

    public virtual ICollection<nguoi_nhan_thong_bao> nguoi_nhan_thong_baos { get; set; } = new List<nguoi_nhan_thong_bao>();

    public virtual ICollection<nhat_ky_dang_nhap> nhat_ky_dang_nhaps { get; set; } = new List<nhat_ky_dang_nhap>();

    public virtual ICollection<nhat_ky_he_thong> nhat_ky_he_thongs { get; set; } = new List<nhat_ky_he_thong>();

    public virtual ICollection<nhiem_vu_cuu_ho> nhiem_vu_cuu_hoclosed_byNavigations { get; set; } = new List<nhiem_vu_cuu_ho>();

    public virtual ICollection<nhiem_vu_cuu_ho> nhiem_vu_cuu_hocoordinator_users { get; set; } = new List<nhiem_vu_cuu_ho>();

    public virtual ICollection<phat_cuu_tro> phat_cuu_tros { get; set; } = new List<phat_cuu_tro>();

    public virtual ICollection<phieu_cap_phat_cuu_tro> phieu_cap_phat_cuu_troissued_byNavigations { get; set; } = new List<phieu_cap_phat_cuu_tro>();

    public virtual ICollection<phieu_cap_phat_cuu_tro> phieu_cap_phat_cuu_troreceived_byNavigations { get; set; } = new List<phieu_cap_phat_cuu_tro>();

    public virtual ICollection<phieu_kho> phieu_khoapproved_byNavigations { get; set; } = new List<phieu_kho>();

    public virtual ICollection<phieu_kho> phieu_khocreated_byNavigations { get; set; } = new List<phieu_kho>();

    public virtual ICollection<su_co> su_coassigned_coordinator_users { get; set; } = new List<su_co>();

    public virtual ICollection<su_co> su_coclosed_byNavigations { get; set; } = new List<su_co>();

    public virtual ICollection<su_co> su_coreporter_users { get; set; } = new List<su_co>();

    public virtual ICollection<su_co> su_coverified_byNavigations { get; set; } = new List<su_co>();

    public virtual ICollection<tep_tin_su_co> tep_tin_su_cos { get; set; } = new List<tep_tin_su_co>();

    public virtual ICollection<tep_tin> tep_tins { get; set; } = new List<tep_tin>();

    public virtual ICollection<thanh_vien_doi> thanh_vien_dois { get; set; } = new List<thanh_vien_doi>();

    public virtual ICollection<thong_so_he_thong> thong_so_he_thongs { get; set; } = new List<thong_so_he_thong>();

    public virtual ICollection<tinh_trang_hien_truong> tinh_trang_hien_truongs { get; set; } = new List<tinh_trang_hien_truong>();

    public virtual to_chuc? to_chuc { get; set; }

    public virtual ICollection<vi_tri_su_co> vi_tri_su_cos { get; set; } = new List<vi_tri_su_co>();

    public virtual ICollection<xac_nhan_duoc_cuu> xac_nhan_duoc_cuus { get; set; } = new List<xac_nhan_duoc_cuu>();

    public virtual ICollection<yeu_cau_chi_vien> yeu_cau_chi_viens { get; set; } = new List<yeu_cau_chi_vien>();

    public virtual ICollection<yeu_cau_huy_nhiem_vu> yeu_cau_huy_nhiem_vudecided_byNavigations { get; set; } = new List<yeu_cau_huy_nhiem_vu>();

    public virtual ICollection<yeu_cau_huy_nhiem_vu> yeu_cau_huy_nhiem_vurequested_byNavigations { get; set; } = new List<yeu_cau_huy_nhiem_vu>();
}
