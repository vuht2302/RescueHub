using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class tep_tin
{
    public Guid id { get; set; }

    public string file_name { get; set; } = null!;

    public string content_type { get; set; } = null!;

    public long file_size { get; set; }

    public string? storage_bucket { get; set; }

    public string object_key { get; set; } = null!;

    public string? file_url { get; set; }

    public string? checksum { get; set; }

    public Guid? uploaded_by { get; set; }

    public DateTime uploaded_at { get; set; }

    public virtual ICollection<bao_cao_hien_truong_tep_tin> bao_cao_hien_truong_tep_tins { get; set; } = new List<bao_cao_hien_truong_tep_tin>();

    public virtual ICollection<chung_chi_thanh_vien> chung_chi_thanh_viens { get; set; } = new List<chung_chi_thanh_vien>();

    public virtual ICollection<tep_tin_su_co> tep_tin_su_cos { get; set; } = new List<tep_tin_su_co>();

    public virtual nguoi_dung? uploaded_byNavigation { get; set; }

    public virtual ICollection<xac_nhan_nhan_cuu_tro> xac_nhan_nhan_cuu_tros { get; set; } = new List<xac_nhan_nhan_cuu_tro>();
}
