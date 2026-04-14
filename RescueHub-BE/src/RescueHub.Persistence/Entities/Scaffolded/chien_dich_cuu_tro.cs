using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class chien_dich_cuu_tro
{
    public Guid id { get; set; }

    public string campaign_code { get; set; } = null!;

    public string campaign_name { get; set; } = null!;

    public Guid? su_co_id { get; set; }

    public Guid? workflow_state_id { get; set; }

    public DateTime? start_at { get; set; }

    public DateTime? end_at { get; set; }

    public Guid? responsible_don_vi_id { get; set; }

    public Guid? target_khu_vuc_id { get; set; }

    public string? description { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<diem_cuu_tro> diem_cuu_tros { get; set; } = new List<diem_cuu_tro>();

    public virtual ICollection<phat_cuu_tro> phat_cuu_tros { get; set; } = new List<phat_cuu_tro>();

    public virtual ICollection<phieu_cap_phat_cuu_tro> phieu_cap_phat_cuu_tros { get; set; } = new List<phieu_cap_phat_cuu_tro>();

    public virtual don_vi? responsible_don_vi { get; set; }

    public virtual su_co? su_co { get; set; }

    public virtual khu_vuc_hanh_chinh? target_khu_vuc { get; set; }

    public virtual workflow_state? workflow_state { get; set; }

    public virtual ICollection<yeu_cau_cuu_tro> yeu_cau_cuu_tros { get; set; } = new List<yeu_cau_cuu_tro>();
}
