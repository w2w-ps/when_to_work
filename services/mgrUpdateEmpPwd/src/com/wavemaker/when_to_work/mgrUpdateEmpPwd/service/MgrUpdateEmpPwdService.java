package com.wavemaker.when_to_work.mgrUpdateEmpPwd.service;


import com.wavemaker.when_to_work.mgrUpdateEmpPwd.model.*;
import com.wavemaker.when_to_work.mgrUpdateEmpPwd.model.RootRequest;
import com.wavemaker.when_to_work.mgrUpdateEmpPwd.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface MgrUpdateEmpPwdService {

  /**
   * 
   * 
    * @param body RequestBody (optional)
    * @param Authorization Authorization (optional)
   * @return RootResponse
   */
  @RequestLine("POST /login/reset-user-account")
  @Headers({
    "Content-Type: application/json",
    "Accept: application/json",
    "Authorization: {Authorization}"  })
  RootResponse invoke(RootRequest body, @Param("Authorization") String Authorization);

}
