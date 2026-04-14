using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class yeu_cau_cuu_tro
{
    public Guid id { get; set; }

    public string request_code { get; set; } = null!;

    public Guid? chien_dich_cuu_tro_id { get; set; }

    public Guid? su_co_id { get; set; }

    public string request_source_type_code { get; set; } = null!;

    public string? requester_name { get; set; }

    public string? requester_phone { get; set; }

    public Guid? target_khu_vuc_id { get; set; }

    public Guid? workflow_state_id { get; set; }

    public Guid? muc_do_uu_tien_id { get; set; }

    public int? household_count { get; set; }

    public DateTime requested_at { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<chi_tiet_yeu_cau_cuu_tro> chi_tiet_yeu_cau_cuu_tros { get; set; } = new List<chi_tiet_yeu_cau_cuu_tro>();

    public virtual chien_dich_cuu_tro? chien_dich_cuu_tro { get; set; }

    public virtual muc_do_uu_tien? muc_do_uu_tien { get; set; }

    public virtual su_co? su_co { get; set; }

    public virtual khu_vuc_hanh_chinh? target_khu_vuc { get; set; }

    public virtual workflow_state? workflow_state { get; set; }
}
