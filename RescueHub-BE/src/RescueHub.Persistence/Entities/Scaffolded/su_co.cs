using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class su_co
{
    public Guid id { get; set; }

    public string incident_code { get; set; } = null!;

    public Guid loai_su_co_id { get; set; }

    public Guid kenh_tiep_nhan_id { get; set; }

    public bool is_sos { get; set; }

    public Guid? workflow_state_id { get; set; }

    public Guid? muc_do_uu_tien_id { get; set; }

    public Guid? muc_do_nghiem_trong_id { get; set; }

    public Guid? reporter_user_id { get; set; }

    public string? reporter_name { get; set; }

    public string? reporter_phone { get; set; }

    public string? subject { get; set; }

    public string? description { get; set; }

    public int? victim_count_est { get; set; }

    public int? injured_count_est { get; set; }

    public int? vulnerable_count_est { get; set; }

    public bool co_can_cuu_tro { get; set; }

    public Guid? assigned_coordinator_user_id { get; set; }

    public string? ai_summary { get; set; }

    public DateTime reported_at { get; set; }

    public DateTime? verified_at { get; set; }

    public Guid? verified_by { get; set; }

    public DateTime? closed_at { get; set; }

    public Guid? closed_by { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual nguoi_dung? assigned_coordinator_user { get; set; }

    public virtual ICollection<chien_dich_cuu_tro> chien_dich_cuu_tros { get; set; } = new List<chien_dich_cuu_tro>();

    public virtual nguoi_dung? closed_byNavigation { get; set; }

    public virtual ICollection<danh_gia_su_co> danh_gia_su_cos { get; set; } = new List<danh_gia_su_co>();

    public virtual kenh_tiep_nhan kenh_tiep_nhan { get; set; } = null!;

    public virtual ICollection<lich_su_trang_thai_su_co> lich_su_trang_thai_su_cos { get; set; } = new List<lich_su_trang_thai_su_co>();

    public virtual ICollection<lien_ket_su_co> lien_ket_su_cosource_su_cos { get; set; } = new List<lien_ket_su_co>();

    public virtual ICollection<lien_ket_su_co> lien_ket_su_cotarget_su_cos { get; set; } = new List<lien_ket_su_co>();

    public virtual loai_su_co loai_su_co { get; set; } = null!;

    public virtual muc_do_nghiem_trong? muc_do_nghiem_trong { get; set; }

    public virtual muc_do_uu_tien? muc_do_uu_tien { get; set; }

    public virtual ICollection<nhiem_vu_cuu_ho> nhiem_vu_cuu_hos { get; set; } = new List<nhiem_vu_cuu_ho>();

    public virtual ICollection<phat_cuu_tro> phat_cuu_tros { get; set; } = new List<phat_cuu_tro>();

    public virtual nguoi_dung? reporter_user { get; set; }

    public virtual ICollection<tep_tin_su_co> tep_tin_su_cos { get; set; } = new List<tep_tin_su_co>();

    public virtual ICollection<tinh_trang_hien_truong> tinh_trang_hien_truongs { get; set; } = new List<tinh_trang_hien_truong>();

    public virtual nguoi_dung? verified_byNavigation { get; set; }

    public virtual ICollection<vi_tri_su_co> vi_tri_su_cos { get; set; } = new List<vi_tri_su_co>();

    public virtual workflow_state? workflow_state { get; set; }

    public virtual ICollection<xac_nhan_duoc_cuu> xac_nhan_duoc_cuus { get; set; } = new List<xac_nhan_duoc_cuu>();

    public virtual ICollection<yeu_cau_cuu_tro> yeu_cau_cuu_tros { get; set; } = new List<yeu_cau_cuu_tro>();

    public virtual ICollection<yeu_cau_ky_nang_su_co> yeu_cau_ky_nang_su_cos { get; set; } = new List<yeu_cau_ky_nang_su_co>();

    public virtual ICollection<yeu_cau_nang_luc_phuong_tien_su_co> yeu_cau_nang_luc_phuong_tien_su_cos { get; set; } = new List<yeu_cau_nang_luc_phuong_tien_su_co>();
}
